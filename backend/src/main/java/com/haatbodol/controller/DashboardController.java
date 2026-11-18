package com.haatbodol.controller;

import com.haatbodol.model.ListingDto;
import com.haatbodol.patterns.decorator.ListingDecoratorPipeline;
import com.haatbodol.patterns.singleton.DatabasePool;
import com.haatbodol.security.AuthenticatedUser;
import com.haatbodol.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller serving the unified Buyer/Seller User Dashboard ({@code GET /api/dashboard}).
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private static final String USER_PROFILE_SQL = """
            SELECT
                user_id, full_name, email, phone_number, institutional_email,
                residential_address, campus_area, is_campus_verified,
                active_role, account_type, account_status,
                average_rating, total_reviews, created_at
            FROM users
            WHERE user_id = ?
            LIMIT 1
            """;

    private static final String MY_LISTINGS_SQL = """
            SELECT
                p.listing_id,
                p.seller_id,
                p.title,
                p.description,
                p.category,
                CAST(p.original_price AS DOUBLE) AS original_price,
                p.age_in_months,
                p.item_condition,
                CAST(p.suggested_min_price AS DOUBLE) AS suggested_min_price,
                CAST(p.suggested_max_price AS DOUBLE) AS suggested_max_price,
                CAST(p.current_asking_price AS DOUBLE) AS current_asking_price,
                p.pickup_location,
                p.listing_status,
                p.is_negotiable,
                p.auto_drop_enabled,
                p.published_at,
                p.updated_at,
                u.full_name AS seller_name,
                CAST(u.average_rating AS DOUBLE) AS seller_rating,
                u.total_reviews AS seller_reviews,
                u.campus_area AS seller_campus_area,
                u.is_campus_verified,
                img.image_url,
                CAST(adc.min_reserve_price AS DOUBLE) AS min_reserve_price,
                CAST(adc.drop_percentage AS DOUBLE) AS drop_percentage,
                adc.next_drop_at,
                adc.is_halted
            FROM product_listings p
            INNER JOIN users u ON p.seller_id = u.user_id
            LEFT JOIN listing_images img ON p.listing_id = img.listing_id AND img.display_order = 1
            LEFT JOIN auto_drop_configs adc ON p.listing_id = adc.listing_id
            WHERE p.seller_id = ?
            ORDER BY p.published_at DESC, p.listing_id DESC
            """;

    private static final String INCOMING_OFFERS_SQL = """
            SELECT
                ns.session_id,
                ns.listing_id,
                ns.buyer_id,
                ns.round_count,
                CAST(ns.min_slider_price AS DOUBLE) AS min_slider_price,
                CAST(ns.max_slider_price AS DOUBLE) AS max_slider_price,
                CAST(ns.current_offer_amount AS DOUBLE) AS current_offer_amount,
                ns.last_offered_by_id,
                ns.session_status,
                ns.created_at,
                ns.updated_at,
                p.title AS listing_title,
                p.listing_status,
                CAST(p.current_asking_price AS DOUBLE) AS asking_price,
                img.image_url AS listing_image_url,
                b.full_name AS buyer_name,
                b.campus_area AS buyer_campus_area,
                b.is_campus_verified AS buyer_is_campus_verified,
                CAST(b.average_rating AS DOUBLE) AS buyer_rating
            FROM negotiation_sessions ns
            INNER JOIN product_listings p ON ns.listing_id = p.listing_id
            INNER JOIN users b ON ns.buyer_id = b.user_id
            LEFT JOIN listing_images img ON p.listing_id = img.listing_id AND img.display_order = 1
            WHERE p.seller_id = ?
            ORDER BY ns.updated_at DESC
            """;

    private static final String MY_OFFERS_SQL = """
            SELECT
                ns.session_id,
                ns.listing_id,
                ns.buyer_id,
                ns.round_count,
                CAST(ns.min_slider_price AS DOUBLE) AS min_slider_price,
                CAST(ns.max_slider_price AS DOUBLE) AS max_slider_price,
                CAST(ns.current_offer_amount AS DOUBLE) AS current_offer_amount,
                ns.last_offered_by_id,
                ns.session_status,
                ns.created_at,
                ns.updated_at,
                p.title AS listing_title,
                p.listing_status,
                CAST(p.current_asking_price AS DOUBLE) AS asking_price,
                p.seller_id,
                img.image_url AS listing_image_url,
                s.full_name AS seller_name,
                s.campus_area AS seller_campus_area,
                s.is_campus_verified AS seller_is_campus_verified,
                CAST(s.average_rating AS DOUBLE) AS seller_rating
            FROM negotiation_sessions ns
            INNER JOIN product_listings p ON ns.listing_id = p.listing_id
            INNER JOIN users s ON p.seller_id = s.user_id
            LEFT JOIN listing_images img ON p.listing_id = img.listing_id AND img.display_order = 1
            WHERE ns.buyer_id = ?
            ORDER BY ns.updated_at DESC
            """;

    private static final String MY_ORDERS_SQL = """
            SELECT
                o.order_id,
                o.invoice_number,
                o.listing_id,
                o.buyer_id,
                o.seller_id,
                o.session_id,
                CAST(o.final_agreed_price AS DOUBLE) AS final_agreed_price,
                o.payment_method,
                o.payment_status,
                o.delivery_method,
                o.delivery_status,
                o.shipping_address,
                o.completed_at,
                p.title AS listing_title,
                p.category AS listing_category,
                img.image_url AS listing_image_url,
                b.full_name AS buyer_name,
                s.full_name AS seller_name
            FROM transaction_orders o
            INNER JOIN product_listings p ON o.listing_id = p.listing_id
            INNER JOIN users b ON o.buyer_id = b.user_id
            INNER JOIN users s ON o.seller_id = s.user_id
            LEFT JOIN listing_images img ON p.listing_id = img.listing_id AND img.display_order = 1
            WHERE o.buyer_id = ? OR o.seller_id = ?
            ORDER BY o.completed_at DESC
            """;

    private static final String WATCHLIST_SQL = """
            SELECT
                w.watchlist_id,
                w.added_at,
                p.listing_id,
                p.seller_id,
                p.title,
                p.description,
                p.category,
                CAST(p.original_price AS DOUBLE) AS original_price,
                p.age_in_months,
                p.item_condition,
                CAST(p.suggested_min_price AS DOUBLE) AS suggested_min_price,
                CAST(p.suggested_max_price AS DOUBLE) AS suggested_max_price,
                CAST(p.current_asking_price AS DOUBLE) AS current_asking_price,
                p.pickup_location,
                p.listing_status,
                p.is_negotiable,
                p.auto_drop_enabled,
                p.published_at,
                p.updated_at,
                u.full_name AS seller_name,
                CAST(u.average_rating AS DOUBLE) AS seller_rating,
                u.total_reviews AS seller_reviews,
                u.campus_area AS seller_campus_area,
                u.is_campus_verified,
                img.image_url,
                CAST(adc.min_reserve_price AS DOUBLE) AS min_reserve_price,
                CAST(adc.drop_percentage AS DOUBLE) AS drop_percentage,
                adc.next_drop_at,
                adc.is_halted
            FROM watchlist_items w
            INNER JOIN product_listings p ON w.listing_id = p.listing_id
            INNER JOIN users u ON p.seller_id = u.user_id
            LEFT JOIN listing_images img ON p.listing_id = img.listing_id AND img.display_order = 1
            LEFT JOIN auto_drop_configs adc ON p.listing_id = adc.listing_id AND adc.is_halted = 0
            WHERE w.user_id = ? AND p.listing_status <> 'HIDDEN'
            ORDER BY w.added_at DESC
            """;

    private final JwtService jwtService;

    public DashboardController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(HttpServletRequest request) {
        AuthenticatedUser authUser = jwtService.extractAuthenticatedUser(request);
        if (authUser == null) {
            return errorResponse(HttpStatus.UNAUTHORIZED, "Authentication required. Please sign in to view your dashboard.");
        }

        long userId = authUser.getUserId();

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            Map<String, Object> userProfile = fetchUserProfile(conn, userId);
            if (userProfile == null) {
                return errorResponse(HttpStatus.UNAUTHORIZED, "User account not found.");
            }
            if (!"ACTIVE".equalsIgnoreCase(String.valueOf(userProfile.get("account_status")))) {
                return errorResponse(HttpStatus.FORBIDDEN, "Your account is currently not active.");
            }

            Map<String, Object> safeUser = jwtService.sanitizeUser(userProfile);

            List<Map<String, Object>> myListings = fetchMyListings(conn, userId);
            List<Map<String, Object>> incomingOffers = fetchIncomingOffers(conn, userId);
            List<Map<String, Object>> myOffers = fetchMyOffers(conn, userId);
            List<Map<String, Object>> myOrders = fetchMyOrders(conn, userId);
            List<Map<String, Object>> watchlist = fetchWatchlist(conn, userId);

            long activeListingsCount = myListings.stream()
                    .filter(item -> "AVAILABLE".equalsIgnoreCase(String.valueOf(item.get("listing_status"))))
                    .count();
            long soldListingsCount = myListings.stream()
                    .filter(item -> "SOLD".equalsIgnoreCase(String.valueOf(item.get("listing_status"))))
                    .count();

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalListings", myListings.size());
            stats.put("activeListings", activeListingsCount);
            stats.put("soldListings", soldListingsCount);
            stats.put("incomingOffersCount", incomingOffers.size());
            stats.put("myOffersCount", myOffers.size());
            stats.put("ordersCount", myOrders.size());
            stats.put("watchlistCount", watchlist.size());

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("user", safeUser);
            resp.put("stats", stats);
            resp.put("myListings", myListings);
            resp.put("incomingOffers", incomingOffers);
            resp.put("myOffers", myOffers);
            resp.put("myOrders", myOrders);
            resp.put("watchlist", watchlist);
            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to load dashboard data.");
        }
    }

    private Map<String, Object> fetchUserProfile(Connection conn, long userId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(USER_PROFILE_SQL)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
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
        }
    }

    private List<Map<String, Object>> fetchMyListings(Connection conn, long sellerId) throws SQLException {
        List<ListingDto> dtos = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(MY_LISTINGS_SQL)) {
            ps.setLong(1, sellerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    dtos.add(mapListingRow(rs));
                }
            }
        }
        return ListingDecoratorPipeline.decorateAll(dtos);
    }

    private List<Map<String, Object>> fetchIncomingOffers(Connection conn, long sellerId) throws SQLException {
        List<Map<String, Object>> offers = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(INCOMING_OFFERS_SQL)) {
            ps.setLong(1, sellerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("session_id", rs.getLong("session_id"));
                    row.put("listing_id", rs.getLong("listing_id"));
                    row.put("listing_title", rs.getString("listing_title"));
                    row.put("listing_status", rs.getString("listing_status"));
                    row.put("listing_image_url", rs.getString("listing_image_url"));
                    row.put("asking_price", getNullableDouble(rs, "asking_price"));
                    row.put("buyer_id", rs.getLong("buyer_id"));
                    row.put("buyer_name", rs.getString("buyer_name"));
                    row.put("buyer_campus_area", rs.getString("buyer_campus_area"));
                    row.put("buyer_is_campus_verified", rs.getInt("buyer_is_campus_verified") == 1);
                    row.put("buyer_rating", getNullableDouble(rs, "buyer_rating"));
                    row.put("round_count", rs.getInt("round_count"));
                    row.put("min_slider_price", getNullableDouble(rs, "min_slider_price"));
                    row.put("max_slider_price", getNullableDouble(rs, "max_slider_price"));
                    row.put("current_offer_amount", getNullableDouble(rs, "current_offer_amount"));
                    row.put("last_offered_by_id", rs.getLong("last_offered_by_id"));
                    row.put("session_status", rs.getString("session_status"));
                    Timestamp createdAt = rs.getTimestamp("created_at");
                    row.put("created_at", createdAt != null ? createdAt.toInstant().toString() : null);
                    Timestamp updatedAt = rs.getTimestamp("updated_at");
                    row.put("updated_at", updatedAt != null ? updatedAt.toInstant().toString() : null);
                    offers.add(row);
                }
            }
        }
        return offers;
    }

    private List<Map<String, Object>> fetchMyOffers(Connection conn, long buyerId) throws SQLException {
        List<Map<String, Object>> offers = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(MY_OFFERS_SQL)) {
            ps.setLong(1, buyerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("session_id", rs.getLong("session_id"));
                    row.put("listing_id", rs.getLong("listing_id"));
                    row.put("listing_title", rs.getString("listing_title"));
                    row.put("listing_status", rs.getString("listing_status"));
                    row.put("listing_image_url", rs.getString("listing_image_url"));
                    row.put("asking_price", getNullableDouble(rs, "asking_price"));
                    row.put("seller_id", rs.getLong("seller_id"));
                    row.put("seller_name", rs.getString("seller_name"));
                    row.put("seller_campus_area", rs.getString("seller_campus_area"));
                    row.put("seller_is_campus_verified", rs.getInt("seller_is_campus_verified") == 1);
                    row.put("seller_rating", getNullableDouble(rs, "seller_rating"));
                    row.put("buyer_id", rs.getLong("buyer_id"));
                    row.put("round_count", rs.getInt("round_count"));
                    row.put("min_slider_price", getNullableDouble(rs, "min_slider_price"));
                    row.put("max_slider_price", getNullableDouble(rs, "max_slider_price"));
                    row.put("current_offer_amount", getNullableDouble(rs, "current_offer_amount"));
                    row.put("last_offered_by_id", rs.getLong("last_offered_by_id"));
                    row.put("session_status", rs.getString("session_status"));
                    Timestamp createdAt = rs.getTimestamp("created_at");
                    row.put("created_at", createdAt != null ? createdAt.toInstant().toString() : null);
                    Timestamp updatedAt = rs.getTimestamp("updated_at");
                    row.put("updated_at", updatedAt != null ? updatedAt.toInstant().toString() : null);
                    offers.add(row);
                }
            }
        }
        return offers;
    }

    private List<Map<String, Object>> fetchMyOrders(Connection conn, long userId) throws SQLException {
        List<Map<String, Object>> orders = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(MY_ORDERS_SQL)) {
            ps.setLong(1, userId);
            ps.setLong(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    long buyerId = rs.getLong("buyer_id");
                    long sellerId = rs.getLong("seller_id");

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("order_id", rs.getLong("order_id"));
                    row.put("invoice_number", rs.getString("invoice_number"));
                    row.put("listing_id", rs.getLong("listing_id"));
                    row.put("listing_title", rs.getString("listing_title"));
                    row.put("listing_category", rs.getString("listing_category"));
                    row.put("listing_image_url", rs.getString("listing_image_url"));
                    row.put("buyer_id", buyerId);
                    row.put("buyer_name", rs.getString("buyer_name"));
                    row.put("seller_id", sellerId);
                    row.put("seller_name", rs.getString("seller_name"));
                    row.put("role_in_order", buyerId == userId ? "BUYER" : "SELLER");
                    row.put("final_agreed_price", getNullableDouble(rs, "final_agreed_price"));
                    row.put("payment_method", rs.getString("payment_method"));
                    row.put("payment_status", rs.getString("payment_status"));
                    row.put("delivery_method", rs.getString("delivery_method"));
                    row.put("delivery_status", rs.getString("delivery_status"));
                    row.put("shipping_address", rs.getString("shipping_address"));
                    Timestamp completedAt = rs.getTimestamp("completed_at");
                    row.put("completed_at", completedAt != null ? completedAt.toInstant().toString() : null);
                    orders.add(row);
                }
            }
        }
        return orders;
    }

    private List<Map<String, Object>> fetchWatchlist(Connection conn, long userId) throws SQLException {
        List<Map<String, Object>> items = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(WATCHLIST_SQL)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    long watchlistId = rs.getLong("watchlist_id");
                    Timestamp addedAt = rs.getTimestamp("added_at");

                    ListingDto dto = mapListingRow(rs);
                    Map<String, Object> decorated = ListingDecoratorPipeline.decorate(dto);
                    decorated.put("watchlist_id", watchlistId);
                    decorated.put("added_at", addedAt != null ? addedAt.toInstant().toString() : null);
                    items.add(decorated);
                }
            }
        }
        return items;
    }

    private static ListingDto mapListingRow(ResultSet rs) throws SQLException {
        ListingDto dto = new ListingDto();
        dto.setListingId(rs.getLong("listing_id"));
        dto.setSellerId(rs.getLong("seller_id"));
        dto.setTitle(rs.getString("title"));
        dto.setDescription(rs.getString("description"));
        dto.setCategory(rs.getString("category"));
        dto.setOriginalPrice(getNullableDouble(rs, "original_price"));
        dto.setAgeInMonths(rs.getInt("age_in_months"));
        dto.setItemCondition(rs.getString("item_condition"));
        dto.setSuggestedMinPrice(getNullableDouble(rs, "suggested_min_price"));
        dto.setSuggestedMaxPrice(getNullableDouble(rs, "suggested_max_price"));
        dto.setCurrentAskingPrice(getNullableDouble(rs, "current_asking_price"));
        dto.setPickupLocation(rs.getString("pickup_location"));
        dto.setListingStatus(rs.getString("listing_status"));
        dto.setIsNegotiable(rs.getInt("is_negotiable") == 1);
        dto.setAutoDropEnabled(rs.getInt("auto_drop_enabled") == 1);

        Timestamp publishedAt = rs.getTimestamp("published_at");
        dto.setPublishedAt(publishedAt != null ? publishedAt.toInstant().toString() : null);
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        dto.setUpdatedAt(updatedAt != null ? updatedAt.toInstant().toString() : null);

        dto.setSellerName(rs.getString("seller_name"));
        dto.setSellerRating(getNullableDouble(rs, "seller_rating"));
        dto.setSellerReviews(rs.getInt("seller_reviews"));
        dto.setCampusArea(rs.getString("seller_campus_area"));
        dto.setIsCampusVerified(rs.getInt("is_campus_verified") == 1);

        String imageUrl = rs.getString("image_url");
        dto.setImageUrl(imageUrl);
        if (imageUrl != null && !imageUrl.isBlank()) {
            dto.setImages(List.of(imageUrl));
        }

        dto.setMinReservePrice(getNullableDouble(rs, "min_reserve_price"));
        dto.setDropPercentage(getNullableDouble(rs, "drop_percentage"));

        Timestamp nextDropAt = rs.getTimestamp("next_drop_at");
        dto.setNextDropAt(nextDropAt != null ? nextDropAt.toInstant().toString() : null);

        Object isHaltedObj = rs.getObject("is_halted");
        if (isHaltedObj instanceof Number num) {
            dto.setIsHalted(num.intValue() == 1);
        } else if (isHaltedObj instanceof Boolean boolVal) {
            dto.setIsHalted(boolVal);
        } else {
            dto.setIsHalted(false);
        }
        return dto;
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

    private static ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("error", message);
        err.put("message", message);
        return ResponseEntity.status(status).body(err);
    }
}
