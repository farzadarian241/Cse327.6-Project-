package com.haatbodol.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.haatbodol.patterns.singleton.DatabasePool;
import com.haatbodol.security.JwtService;
import com.haatbodol.security.PasswordService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * REST Controller handling registration, login, logout, session introspection,
 * and BUYER/SELLER role switching for the HaatBodol Next.js frontend.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private static final String USER_PUBLIC_COLUMNS =
            "user_id, full_name, email, phone_number, institutional_email, "
                    + "residential_address, campus_area, is_campus_verified, "
                    + "active_role, account_type, account_status, "
                    + "average_rating, total_reviews, created_at";

    private static final String USER_AUTH_COLUMNS =
            "user_id, full_name, email, phone_number, institutional_email, "
                    + "password_hash, residential_address, campus_area, is_campus_verified, "
                    + "active_role, account_type, account_status, "
                    + "average_rating, total_reviews, created_at";

    private final JwtService jwtService;
    private final PasswordService passwordService;
    private final ObjectMapper objectMapper;

    public AuthController(JwtService jwtService, PasswordService passwordService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.passwordService = passwordService;
        this.objectMapper = objectMapper;
    }

    /**
     * POST /api/auth/register
     * Registers a new campus/community user, auto-verifying .edu / .edu.bd / .ac.bd emails.
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(HttpServletRequest request) {
        Map<String, Object> body;
        try {
            body = readJsonBody(request, false);
        } catch (IOException ex) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON request payload.");
        }
        if (body == null) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON request payload.");
        }

        String fullName = firstNonBlank(body, "full_name", "fullName");
        String email = firstNonBlank(body, "email").toLowerCase(Locale.ROOT);
        String password = body.get("password") instanceof String s ? s : "";
        String phoneNumber = firstNonBlank(body, "phone_number", "phoneNumber");
        String residentialAddress = firstNonBlank(body, "residential_address", "residentialAddress");
        String campusArea = firstNonBlank(body, "campus_area", "campusArea");
        if (campusArea.isEmpty()) {
            campusArea = "Dhaka Central";
        }
        String rawInstEmail = firstNonBlank(body, "institutional_email", "institutionalEmail").toLowerCase(Locale.ROOT);
        String institutionalEmail = rawInstEmail.isEmpty() ? null : rawInstEmail;

        // Required fields validation
        if (fullName.isEmpty()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Full name is required.");
        }
        if (email.isEmpty()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Email address is required.");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Please provide a valid email address.");
        }
        if (institutionalEmail != null && !EMAIL_PATTERN.matcher(institutionalEmail).matches()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Please provide a valid institutional email address.");
        }
        if (password.length() < 6) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters long.");
        }
        if (phoneNumber.isEmpty()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Phone number is required.");
        }
        if (residentialAddress.isEmpty()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Residential address is required.");
        }

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            // Check duplicate email
            try (PreparedStatement checkPs = conn.prepareStatement(
                    "SELECT user_id FROM users WHERE LOWER(email) = ? LIMIT 1")) {
                checkPs.setString(1, email);
                try (ResultSet rs = checkPs.executeQuery()) {
                    if (rs.next()) {
                        return errorResponse(HttpStatus.CONFLICT, "An account with this email address already exists.");
                    }
                }
            }

            // Detect campus email verification (.edu / .edu.bd / .ac.bd)
            int isCampusVerified = (jwtService.isCampusEmail(email)
                    || (institutionalEmail != null && jwtService.isCampusEmail(institutionalEmail))) ? 1 : 0;

            String passwordHash = passwordService.hashPassword(password);

            long newUserId;
            String insertSql = "INSERT INTO users ("
                    + "full_name, email, phone_number, institutional_email, "
                    + "password_hash, residential_address, campus_area, "
                    + "is_campus_verified, active_role, account_type, account_status"
                    + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BUYER', 'USER', 'ACTIVE')";

            try (PreparedStatement insertPs = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                insertPs.setString(1, fullName);
                insertPs.setString(2, email);
                insertPs.setString(3, phoneNumber);
                if (institutionalEmail != null) {
                    insertPs.setString(4, institutionalEmail);
                } else {
                    insertPs.setNull(4, Types.VARCHAR);
                }
                insertPs.setString(5, passwordHash);
                insertPs.setString(6, residentialAddress);
                insertPs.setString(7, campusArea);
                insertPs.setInt(8, isCampusVerified);

                insertPs.executeUpdate();
                try (ResultSet keys = insertPs.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException("Failed to obtain generated user_id after insert.");
                    }
                    newUserId = keys.getLong(1);
                }
            }

            Map<String, Object> createdUser = fetchUserById(conn, newUserId);
            Map<String, Object> safeUser = jwtService.sanitizeUser(createdUser);

            String token = jwtService.signAuthToken(safeUser);
            ResponseCookie cookie = jwtService.createAuthCookie(token);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "Account registered successfully.");
            resp.put("user", safeUser);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(resp);
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An internal server error occurred during registration.");
        }
    }

    /**
     * POST /api/auth/login
     * Verifies BCrypt credentials, enforces SUSPENDED/BANNED guards, and issues JWT session cookie.
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(HttpServletRequest request) {
        Map<String, Object> body;
        try {
            body = readJsonBody(request, false);
        } catch (IOException ex) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }
        if (body == null) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }

        String email = firstNonBlank(body, "email").toLowerCase(Locale.ROOT);
        String password = body.get("password") instanceof String s ? s : "";

        if (email.isEmpty() || password.isEmpty()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            Map<String, Object> userRow = null;
            String passwordHash = null;

            String sql = "SELECT " + USER_AUTH_COLUMNS + " FROM users WHERE LOWER(email) = ? LIMIT 1";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, email);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        userRow = mapUserRow(rs, true);
                        passwordHash = rs.getString("password_hash");
                    }
                }
            }

            if (userRow == null || !passwordService.verifyPassword(password, passwordHash)) {
                return errorResponse(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
            }

            String accountStatus = String.valueOf(userRow.get("account_status"));
            if ("SUSPENDED".equalsIgnoreCase(accountStatus)) {
                return errorResponse(HttpStatus.FORBIDDEN,
                        "Your account has been temporarily suspended. Please contact campus administration.");
            }
            if ("BANNED".equalsIgnoreCase(accountStatus)) {
                return errorResponse(HttpStatus.FORBIDDEN,
                        "Your account has been permanently banned from HaatBodol.");
            }

            Map<String, Object> safeUser = jwtService.sanitizeUser(userRow);
            String token = jwtService.signAuthToken(safeUser);
            ResponseCookie cookie = jwtService.createAuthCookie(token);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "Login successful.");
            resp.put("user", safeUser);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(resp);
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An internal server error occurred during login.");
        }
    }

    /**
     * POST /api/auth/logout
     * Clears the HTTP-only haatbodol_session cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        ResponseCookie clearCookie = jwtService.createClearCookie();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Logged out successfully.");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(resp);
    }

    /**
     * GET /api/auth/me
     * Reads JWT cookie; returns { user: null, unreadNotifications: 0 } if missing/invalid,
     * otherwise queries fresh user data + unread notification count.
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
        Map<String, Object> session = jwtService.extractSessionFromRequest(request);
        if (session == null || session.get("user_id") == null) {
            Map<String, Object> emptyResp = new LinkedHashMap<>();
            emptyResp.put("user", null);
            emptyResp.put("unreadNotifications", 0);
            return ResponseEntity.ok(emptyResp);
        }

        long userId = ((Number) session.get("user_id")).longValue();

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            Map<String, Object> userRow = fetchUserById(conn, userId);
            if (userRow == null || !"ACTIVE".equalsIgnoreCase(String.valueOf(userRow.get("account_status")))) {
                ResponseCookie clearCookie = jwtService.createClearCookie();
                Map<String, Object> emptyResp = new LinkedHashMap<>();
                emptyResp.put("user", null);
                emptyResp.put("unreadNotifications", 0);
                return ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                        .body(emptyResp);
            }

            long unreadCount = 0L;
            try (PreparedStatement countPs = conn.prepareStatement(
                    "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0")) {
                countPs.setLong(1, userId);
                try (ResultSet rs = countPs.executeQuery()) {
                    if (rs.next()) {
                        unreadCount = rs.getLong("unread");
                    }
                }
            }

            Map<String, Object> safeUser = jwtService.sanitizeUser(userRow);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("user", safeUser);
            resp.put("unreadNotifications", unreadCount);
            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("user", null);
            err.put("unreadNotifications", 0);
            err.put("error", "Failed to retrieve session");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    /**
     * PATCH /api/auth/role
     * Requires authenticated JWT cookie. Toggles or explicitly sets active_role (BUYER <-> SELLER),
     * persists to MySQL, and issues a refreshed JWT session cookie.
     */
    @PatchMapping("/role")
    public ResponseEntity<Map<String, Object>> switchRole(HttpServletRequest request) {
        Map<String, Object> session = jwtService.extractSessionFromRequest(request);
        if (session == null || session.get("user_id") == null) {
            return errorResponse(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        long userId = ((Number) session.get("user_id")).longValue();
        String targetRole = null;

        try {
            Map<String, Object> body = readJsonBody(request, true);
            if (body != null && body.get("role") instanceof String roleStr && !roleStr.isBlank()) {
                String upper = roleStr.trim().toUpperCase(Locale.ROOT);
                if ("BUYER".equals(upper) || "SELLER".equals(upper)) {
                    targetRole = upper;
                } else {
                    return errorResponse(HttpStatus.BAD_REQUEST,
                            "Invalid role specified. Role must be 'BUYER' or 'SELLER'.");
                }
            }
        } catch (IOException ignored) {
            // Empty or non-JSON body defaults to toggle behavior
        }

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            if (targetRole == null) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT active_role FROM users WHERE user_id = ? LIMIT 1")) {
                    ps.setLong(1, userId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            return errorResponse(HttpStatus.NOT_FOUND, "User account not found.");
                        }
                        String currentRole = rs.getString("active_role");
                        targetRole = "SELLER".equalsIgnoreCase(currentRole) ? "BUYER" : "SELLER";
                    }
                }
            }

            try (PreparedStatement updatePs = conn.prepareStatement(
                    "UPDATE users SET active_role = ? WHERE user_id = ?")) {
                updatePs.setString(1, targetRole);
                updatePs.setLong(2, userId);
                updatePs.executeUpdate();
            }

            Map<String, Object> updatedUser = fetchUserById(conn, userId);
            if (updatedUser == null) {
                return errorResponse(HttpStatus.NOT_FOUND, "User account not found.");
            }

            Map<String, Object> safeUser = jwtService.sanitizeUser(updatedUser);
            String token = jwtService.signAuthToken(safeUser);
            ResponseCookie cookie = jwtService.createAuthCookie(token);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "Switched active role to " + targetRole + ".");
            resp.put("user", safeUser);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(resp);
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An internal server error occurred while updating role.");
        }
    }

    private Map<String, Object> fetchUserById(Connection conn, long userId) throws SQLException {
        String sql = "SELECT " + USER_PUBLIC_COLUMNS + " FROM users WHERE user_id = ? LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUserRow(rs, false);
                }
            }
        }
        return null;
    }

    private Map<String, Object> mapUserRow(ResultSet rs, boolean includePasswordHash) throws SQLException {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("user_id", rs.getLong("user_id"));
        map.put("full_name", rs.getString("full_name"));
        map.put("email", rs.getString("email"));
        map.put("phone_number", rs.getString("phone_number"));
        map.put("institutional_email", rs.getString("institutional_email"));
        if (includePasswordHash) {
            map.put("password_hash", rs.getString("password_hash"));
        }
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

    private Map<String, Object> readJsonBody(HttpServletRequest request, boolean allowEmpty) throws IOException {
        byte[] bytes = request.getInputStream().readAllBytes();
        String raw = new String(bytes, StandardCharsets.UTF_8).trim();
        if (raw.isEmpty()) {
            return allowEmpty ? null : null;
        }
        return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
    }

    private static String firstNonBlank(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) {
                String s = val.toString().trim();
                if (!s.isEmpty()) {
                    return s;
                }
            }
        }
        return "";
    }

    private static ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("message", message);
        err.put("error", message);
        return ResponseEntity.status(status).body(err);
    }
}
