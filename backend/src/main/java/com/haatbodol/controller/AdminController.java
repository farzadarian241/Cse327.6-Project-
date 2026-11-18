package com.haatbodol.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.haatbodol.patterns.proxy.ListingAccessException;
import com.haatbodol.patterns.proxy.ListingAccessService;
import com.haatbodol.patterns.singleton.DatabasePool;
import com.haatbodol.security.AuthenticatedUser;
import com.haatbodol.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * REST Controller for HaatBodol Admin Moderation &amp; Governance ({@code /api/admin/**}).
 *
 * <p>Every endpoint enforces strict live-DB admin verification (401 when unauthenticated,
 * 403 when {@code account_type != 'ADMIN'} or account is inactive) and routes listing removals
 * through {@link com.haatbodol.patterns.proxy.ListingAccessProxy}.</p>
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final List<String> ALLOWED_ACCOUNT_STATUSES = List.of(
            "ACTIVE",
            "SUSPENDED",
            "BANNED"
    );

    private static final String USER_PUBLIC_COLUMNS = """
            user_id, full_name, email, phone_number, institutional_email,
            residential_address, campus_area, is_campus_verified,
            active_role, account_type, account_status,
            average_rating, total_reviews, created_at
            """;

    private static final String AUTODROP_OVERVIEW_SQL = """
            SELECT
                adc.config_id,
                adc.listing_id,
                p.title,
                p.listing_status,
                p.seller_id,
                u.full_name AS seller_name,
                CAST(p.current_asking_price AS DOUBLE) AS current_asking_price,
                CAST(adc.min_reserve_price AS DOUBLE) AS min_reserve_price,
                CAST(adc.drop_percentage AS DOUBLE) AS drop_percentage,
                adc.interval_hours,
                adc.last_drop_at,
                adc.next_drop_at,
                adc.is_halted
            FROM auto_drop_configs adc
            INNER JOIN product_listings p ON adc.listing_id = p.listing_id
            INNER JOIN users u ON p.seller_id = u.user_id
            ORDER BY adc.is_halted ASC, adc.next_drop_at ASC
            """;

    private static final String REPORTS_QUEUE_SQL = """
            SELECT
                r.report_id,
                r.listing_id,
                r.reporter_id,
                r.admin_id,
                r.reason,
                r.details,
                r.report_status,
                r.created_at,
                r.resolved_at,
                p.title AS listing_title,
                p.listing_status,
                CAST(p.current_asking_price AS DOUBLE) AS current_asking_price,
                p.seller_id,
                seller.full_name AS seller_name,
                seller.email AS seller_email,
                reporter.full_name AS reporter_name,
                reporter.email AS reporter_email,
                admin_u.full_name AS admin_name
            FROM moderation_reports r
            INNER JOIN product_listings p ON r.listing_id = p.listing_id
            INNER JOIN users seller ON p.seller_id = seller.user_id
            INNER JOIN users reporter ON r.reporter_id = reporter.user_id
            LEFT JOIN users admin_u ON r.admin_id = admin_u.user_id
            ORDER BY CASE WHEN r.report_status = 'OPEN' THEN 0 ELSE 1 END ASC, r.created_at DESC
            """;

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final ListingAccessService listingAccessProxy;

    public AdminController(
            JwtService jwtService,
            ObjectMapper objectMapper,
            @Qualifier("listingAccessProxy") ListingAccessService listingAccessProxy
    ) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.listingAccessProxy = listingAccessProxy;
    }

    /**
     * GET /api/admin/overview
     * Returns platform-wide KPIs and the read-only Auto-Drop schedule overview.
     */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview(HttpServletRequest request) {
        requireAdmin(request);

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            Map<String, Object> kpis = new LinkedHashMap<>();
            kpis.put("totalUsers", queryCount(conn, "SELECT COUNT(*) FROM users"));
            kpis.put("verifiedStudents", queryCount(conn, "SELECT COUNT(*) FROM users WHERE is_campus_verified = 1"));
            kpis.put("activeListings", queryCount(conn, "SELECT COUNT(*) FROM product_listings WHERE listing_status = 'AVAILABLE'"));
            kpis.put("totalListings", queryCount(conn, "SELECT COUNT(*) FROM product_listings"));
            kpis.put("openReports", queryCount(conn, "SELECT COUNT(*) FROM moderation_reports WHERE report_status = 'OPEN'"));
            kpis.put("completedOrders", queryCount(conn, "SELECT COUNT(*) FROM transaction_orders"));
            kpis.put("autoDropActiveCount", queryCount(conn, """
                    SELECT COUNT(*)
                    FROM auto_drop_configs adc
                    INNER JOIN product_listings p ON adc.listing_id = p.listing_id
                    WHERE adc.is_halted = 0 AND p.auto_drop_enabled = 1 AND p.listing_status = 'AVAILABLE'
                    """));

            List<Map<String, Object>> autoDropConfigs = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(AUTODROP_OVERVIEW_SQL);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> cfg = new LinkedHashMap<>();
                    cfg.put("config_id", rs.getLong("config_id"));
                    cfg.put("listing_id", rs.getLong("listing_id"));
                    String title = rs.getString("title");
                    cfg.put("title", title);
                    cfg.put("listing_title", title);
                    cfg.put("listing_status", rs.getString("listing_status"));
                    cfg.put("seller_id", rs.getLong("seller_id"));
                    cfg.put("seller_name", rs.getString("seller_name"));
                    cfg.put("current_asking_price", getNullableDouble(rs, "current_asking_price"));
                    cfg.put("min_reserve_price", getNullableDouble(rs, "min_reserve_price"));
                    cfg.put("drop_percentage", getNullableDouble(rs, "drop_percentage"));
                    cfg.put("interval_hours", rs.getInt("interval_hours"));
                    Timestamp lastDropAt = rs.getTimestamp("last_drop_at");
                    cfg.put("last_drop_at", lastDropAt != null ? lastDropAt.toInstant().toString() : null);
                    Timestamp nextDropAt = rs.getTimestamp("next_drop_at");
                    cfg.put("next_drop_at", nextDropAt != null ? nextDropAt.toInstant().toString() : null);
                    cfg.put("is_halted", rs.getInt("is_halted") == 1);
                    autoDropConfigs.add(cfg);
                }
            }

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("kpis", kpis);
            resp.put("autoDropConfigs", autoDropConfigs);
            return ResponseEntity.ok(resp);
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to load admin overview.");
        }
    }

    /**
     * GET /api/admin/users
     * Returns all sanitized user accounts (never exposing {@code password_hash}).
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(HttpServletRequest request) {
        requireAdmin(request);

        String sql = "SELECT " + USER_PUBLIC_COLUMNS
                + " FROM users ORDER BY CASE WHEN account_type = 'ADMIN' THEN 0 ELSE 1 END ASC, created_at DESC";

        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<Map<String, Object>> users = new ArrayList<>();
            while (rs.next()) {
                users.add(jwtService.sanitizeUser(mapUserRow(rs)));
            }

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("users", users);
            return ResponseEntity.ok(resp);
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve users.");
        }
    }

    /**
     * PATCH /api/admin/users/{userId}/status
     * Updates a user's {@code account_status} ({@code ACTIVE}, {@code SUSPENDED}, or {@code BANNED}).
     * Prevents an administrator from altering their own account status.
     */
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable("userId") long userId,
            HttpServletRequest request
    ) {
        AuthenticatedUser adminUser = requireAdmin(request);

        if (adminUser.getUserId() == userId) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Administrators cannot change their own account status.");
        }

        Map<String, Object> body;
        try {
            body = readJsonBody(request);
        } catch (IOException ex) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON request body.");
        }
        if (body == null || body.get("status") == null) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Target status is required (ACTIVE, SUSPENDED, or BANNED).");
        }

        String rawStatus = String.valueOf(body.get("status")).trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ACCOUNT_STATUSES.contains(rawStatus)) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Invalid status \"" + rawStatus + "\". Allowed values: ACTIVE, SUSPENDED, BANNED.");
        }

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE users SET account_status = ? WHERE user_id = ?")) {
                ps.setString(1, rawStatus);
                ps.setLong(2, userId);
                int updated = ps.executeUpdate();
                if (updated == 0) {
                    return errorResponse(HttpStatus.NOT_FOUND, "User not found.");
                }
            }

            Map<String, Object> updatedUser = fetchUserById(conn, userId);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("message", "User account status updated to " + rawStatus + ".");
            resp.put("user", jwtService.sanitizeUser(updatedUser));
            return ResponseEntity.ok(resp);
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update user account status.");
        }
    }

    /**
     * GET /api/admin/reports
     * Lists moderation reports joined with listing, seller, and reporter details,
     * prioritizing {@code OPEN} reports first.
     */
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(HttpServletRequest request) {
        requireAdmin(request);

        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(REPORTS_QUEUE_SQL);
             ResultSet rs = ps.executeQuery()) {

            List<Map<String, Object>> reports = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("report_id", rs.getLong("report_id"));
                row.put("listing_id", rs.getLong("listing_id"));
                String listingTitle = rs.getString("listing_title");
                row.put("listing_title", listingTitle);
                row.put("title", listingTitle);
                row.put("listing_status", rs.getString("listing_status"));
                row.put("current_asking_price", getNullableDouble(rs, "current_asking_price"));
                row.put("seller_id", rs.getLong("seller_id"));
                row.put("seller_name", rs.getString("seller_name"));
                row.put("seller_email", rs.getString("seller_email"));
                row.put("reporter_id", rs.getLong("reporter_id"));
                row.put("reporter_name", rs.getString("reporter_name"));
                row.put("reporter_email", rs.getString("reporter_email"));

                Object adminIdObj = rs.getObject("admin_id");
                row.put("admin_id", adminIdObj instanceof Number num ? num.longValue() : null);
                row.put("admin_name", rs.getString("admin_name"));

                row.put("reason", rs.getString("reason"));
                row.put("details", rs.getString("details"));
                row.put("report_status", rs.getString("report_status"));

                Timestamp createdAt = rs.getTimestamp("created_at");
                row.put("created_at", createdAt != null ? createdAt.toInstant().toString() : null);
                Timestamp resolvedAt = rs.getTimestamp("resolved_at");
                row.put("resolved_at", resolvedAt != null ? resolvedAt.toInstant().toString() : null);
                reports.add(row);
            }

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("reports", reports);
            return ResponseEntity.ok(resp);
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve moderation reports.");
        }
    }

    /**
     * PATCH /api/admin/reports/{reportId}
     * Resolves a moderation report with {@code DISMISS} or {@code REMOVE_LISTING}
     * (exercising {@link com.haatbodol.patterns.proxy.ListingAccessProxy#deleteListing}).
     */
    @PatchMapping("/reports/{reportId}")
    public ResponseEntity<Map<String, Object>> resolveReport(
            @PathVariable("reportId") long reportId,
            HttpServletRequest request
    ) {
        AuthenticatedUser adminUser = requireAdmin(request);

        Map<String, Object> body;
        try {
            body = readJsonBody(request);
        } catch (IOException ex) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON request body.");
        }
        if (body == null || body.get("action") == null) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Action is required (DISMISS or REMOVE_LISTING).");
        }

        String action = String.valueOf(body.get("action")).trim().toUpperCase(Locale.ROOT);
        if (!"DISMISS".equals(action) && !"REMOVE_LISTING".equals(action)) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Invalid action \"" + action + "\". Allowed actions: DISMISS, REMOVE_LISTING.");
        }

        long listingId;
        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            try (PreparedStatement findPs = conn.prepareStatement(
                    "SELECT listing_id FROM moderation_reports WHERE report_id = ? LIMIT 1")) {
                findPs.setLong(1, reportId);
                try (ResultSet rs = findPs.executeQuery()) {
                    if (!rs.next()) {
                        return errorResponse(HttpStatus.NOT_FOUND, "Moderation report not found.");
                    }
                    listingId = rs.getLong("listing_id");
                }
            }

            if ("DISMISS".equals(action)) {
                try (PreparedStatement updatePs = conn.prepareStatement(
                        "UPDATE moderation_reports SET report_status = 'DISMISSED', admin_id = ?, resolved_at = NOW() WHERE report_id = ?")) {
                    updatePs.setLong(1, adminUser.getUserId());
                    updatePs.setLong(2, reportId);
                    updatePs.executeUpdate();
                }

                Map<String, Object> resp = new LinkedHashMap<>();
                resp.put("success", true);
                resp.put("action", "DISMISS");
                resp.put("message", "Moderation report dismissed.");
                return ResponseEntity.ok(resp);
            }

            // REMOVE_LISTING: mark ACTION_TAKEN, then remove the listing through the Protection Proxy
            try (PreparedStatement updatePs = conn.prepareStatement(
                    "UPDATE moderation_reports SET report_status = 'ACTION_TAKEN', admin_id = ?, resolved_at = NOW() WHERE report_id = ?")) {
                updatePs.setLong(1, adminUser.getUserId());
                updatePs.setLong(2, reportId);
                updatePs.executeUpdate();
            }
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process moderation report.");
        }

        // Exercise ListingAccessProxy (ON DELETE CASCADE cleans up dependent rows cleanly)
        listingAccessProxy.deleteListing(listingId, adminUser);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("action", "REMOVE_LISTING");
        resp.put("message", "Flagged listing removed via ListingAccessProxy and report resolved.");
        return ResponseEntity.ok(resp);
    }

    @ExceptionHandler(ListingAccessException.class)
    public ResponseEntity<Map<String, Object>> handleListingAccessException(ListingAccessException ex) {
        return errorResponse(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return errorResponse(HttpStatus.BAD_REQUEST, "Invalid identifier parameter.");
    }

    /**
     * Strict admin guard verifying both the JWT cookie AND live MySQL {@code users} table state
     * so revoked, suspended, or non-admin accounts are blocked immediately.
     */
    private AuthenticatedUser requireAdmin(HttpServletRequest request) {
        AuthenticatedUser tokenUser = jwtService.extractAuthenticatedUser(request);
        if (tokenUser == null) {
            throw new ListingAccessException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required. Please sign in with an administrator account."
            );
        }

        String sql = "SELECT user_id, email, active_role, account_type, account_status FROM users WHERE user_id = ? LIMIT 1";
        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, tokenUser.getUserId());
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new ListingAccessException(HttpStatus.UNAUTHORIZED, "User account not found.");
                }
                String accountStatus = rs.getString("account_status");
                String accountType = rs.getString("account_type");
                if (!"ACTIVE".equalsIgnoreCase(accountStatus)) {
                    throw new ListingAccessException(
                            HttpStatus.FORBIDDEN,
                            "Forbidden. Your account is not active."
                    );
                }
                if (!"ADMIN".equalsIgnoreCase(accountType)) {
                    throw new ListingAccessException(
                            HttpStatus.FORBIDDEN,
                            "Forbidden. Administrator privileges are required to access this endpoint."
                    );
                }
                return new AuthenticatedUser(
                        rs.getLong("user_id"),
                        rs.getString("email"),
                        rs.getString("active_role"),
                        accountType
                );
            }
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (SQLException ex) {
            throw new ListingAccessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Database error while verifying administrator privileges.",
                    ex
            );
        }
    }

    private long queryCount(Connection conn, String sql) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getLong(1) : 0L;
        }
    }

    private Map<String, Object> fetchUserById(Connection conn, long userId) throws SQLException {
        String sql = "SELECT " + USER_PUBLIC_COLUMNS + " FROM users WHERE user_id = ? LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUserRow(rs);
                }
            }
        }
        return null;
    }

    private static Map<String, Object> mapUserRow(ResultSet rs) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("user_id", rs.getLong("user_id"));
        map.put("full_name", rs.getString("full_name"));
        map.put("email", rs.getString("email"));
        map.put("phone_number", rs.getString("phone_number"));
        map.put("institutional_email", rs.getString("institutional_email"));
        map.put("residential_address", rs.getString("residential_address"));
        map.put("campus_area", rs.getString("campus_area"));
        map.put("is_campus_verified", rs.getInt("is_campus_verified"));
        map.put("active_role", rs.getString("active_role"));
        map.put("account_type", rs.getString("account_type"));
        map.put("account_status", rs.getString("account_status"));
        BigDecimal avgRating = rs.getBigDecimal("average_rating");
        map.put("average_rating", avgRating != null ? avgRating.doubleValue() : 0.0);
        map.put("total_reviews", rs.getInt("total_reviews"));
        Timestamp createdAt = rs.getTimestamp("created_at");
        map.put("created_at", createdAt != null ? createdAt.toInstant().toString() : null);
        return map;
    }

    private static Double getNullableDouble(ResultSet rs, String column) throws SQLException {
        Object obj = rs.getObject(column);
        if (obj == null) {
            return null;
        }
        if (obj instanceof BigDecimal bd) {
            return bd.doubleValue();
        }
        if (obj instanceof Number num) {
            return num.doubleValue();
        }
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Map<String, Object> readJsonBody(HttpServletRequest request) throws IOException {
        byte[] bytes = request.getInputStream().readAllBytes();
        String raw = new String(bytes, StandardCharsets.UTF_8).trim();
        if (raw.isEmpty()) {
            return null;
        }
        return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
    }

    private static ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("error", message);
        err.put("message", message);
        return ResponseEntity.status(status).body(err);
    }
}
