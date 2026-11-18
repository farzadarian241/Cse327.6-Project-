package com.haatbodol.patterns.proxy;

import com.haatbodol.model.ListingDto;
import com.haatbodol.patterns.decorator.ListingDecoratorPipeline;
import com.haatbodol.patterns.singleton.DatabasePool;
import com.haatbodol.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * <h2>Pattern 7: Protection Proxy — {@code RealListingAccessService}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code RealSubject} — performs direct JDBC database
 * operations via {@link DatabasePool} without enforcing access-control or contact masking.
 * Clients must invoke this service through {@link ListingAccessProxy}.</p>
 */
@Service("realListingAccessService")
public class RealListingAccessService implements ListingAccessService {

    private static final List<String> ALLOWED_CONDITIONS = List.of(
            "Like New",
            "Good",
            "Fair",
            "Needs Repair"
    );

    private static final List<String> ALLOWED_STATUSES = List.of(
            "AVAILABLE",
            "HIDDEN",
            "SOLD",
            "RESERVED"
    );

    private static final String DETAIL_SQL = """
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
                u.email AS seller_email,
                u.phone_number AS seller_phone,
                u.residential_address AS seller_address,
                u.campus_area AS seller_campus_area,
                CAST(u.average_rating AS DOUBLE) AS seller_rating,
                u.total_reviews AS seller_reviews,
                u.is_campus_verified,
                CAST(adc.min_reserve_price AS DOUBLE) AS min_reserve_price,
                CAST(adc.drop_percentage AS DOUBLE) AS drop_percentage,
                adc.next_drop_at,
                adc.is_halted
            FROM product_listings p
            INNER JOIN users u ON p.seller_id = u.user_id
            LEFT JOIN auto_drop_configs adc ON p.listing_id = adc.listing_id
            WHERE p.listing_id = ?
            LIMIT 1
            """;

    private static final String IMAGES_SQL = """
            SELECT image_url
            FROM listing_images
            WHERE listing_id = ?
            ORDER BY display_order ASC, image_id ASC
            """;

    @Override
    public Map<String, Object> getListingDetail(long listingId, AuthenticatedUser requester) {
        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            ListingDto dto = null;
            String sellerPhone = null;
            String sellerAddress = null;
            String sellerEmail = null;

            try (PreparedStatement ps = conn.prepareStatement(DETAIL_SQL)) {
                ps.setLong(1, listingId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        dto = mapDetailRow(rs);
                        sellerPhone = rs.getString("seller_phone");
                        sellerAddress = rs.getString("seller_address");
                        sellerEmail = rs.getString("seller_email");
                    }
                }
            }

            if (dto == null) {
                throw new ListingAccessException(HttpStatus.NOT_FOUND, "Listing not found.");
            }

            List<String> images = new ArrayList<>();
            try (PreparedStatement imgPs = conn.prepareStatement(IMAGES_SQL)) {
                imgPs.setLong(1, listingId);
                try (ResultSet imgRs = imgPs.executeQuery()) {
                    while (imgRs.next()) {
                        String url = imgRs.getString("image_url");
                        if (url != null && !url.isBlank()) {
                            images.add(url.trim());
                        }
                    }
                }
            }

            dto.setImages(images);
            if (!images.isEmpty()) {
                dto.setImageUrl(images.get(0));
            }

            Map<String, Object> decorated = ListingDecoratorPipeline.decorate(dto);
            decorated.put("seller_phone", sellerPhone);
            decorated.put("seller_address", sellerAddress);
            decorated.put("seller_email", sellerEmail);
            return decorated;
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (SQLException ex) {
            throw new ListingAccessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Database error while fetching listing details.",
                    ex
            );
        }
    }

    @Override
    public Map<String, Object> updateListing(
            long listingId,
            Map<String, Object> updates,
            AuthenticatedUser requester
    ) {
        if (updates == null || updates.isEmpty()) {
            throw new ListingAccessException(HttpStatus.BAD_REQUEST, "No update fields were provided.");
        }

        List<String> setClauses = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        if (updates.containsKey("title")) {
            String title = asTrimmedString(updates.get("title"));
            if (title == null || title.length() < 3 || title.length() > 180) {
                throw new ListingAccessException(
                        HttpStatus.BAD_REQUEST,
                        "Title must be between 3 and 180 characters."
                );
            }
            setClauses.add("title = ?");
            params.add(title);
        }

        if (updates.containsKey("description")) {
            String description = asTrimmedString(updates.get("description"));
            if (description == null || description.length() < 5) {
                throw new ListingAccessException(
                        HttpStatus.BAD_REQUEST,
                        "Description must be at least 5 characters."
                );
            }
            setClauses.add("description = ?");
            params.add(description);
        }

        Object rawPrice = firstPresent(updates, "current_asking_price", "currentAskingPrice", "asking_price");
        if (rawPrice != null) {
            Double price = parseDouble(rawPrice);
            if (price == null || price <= 0.0 || price.isNaN() || price.isInfinite()) {
                throw new ListingAccessException(
                        HttpStatus.BAD_REQUEST,
                        "Current asking price must be a positive number greater than 0."
                );
            }
            setClauses.add("current_asking_price = ?");
            params.add(price);
        }

        Object rawCondition = firstPresent(updates, "item_condition", "itemCondition", "condition");
        if (rawCondition != null) {
            String matchedCondition = matchAllowed(ALLOWED_CONDITIONS, String.valueOf(rawCondition));
            if (matchedCondition == null) {
                throw new ListingAccessException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid item_condition. Allowed values: " + String.join(", ", ALLOWED_CONDITIONS) + "."
                );
            }
            setClauses.add("item_condition = ?");
            params.add(matchedCondition);
        }

        Object rawLocation = firstPresent(updates, "pickup_location", "pickupLocation");
        if (rawLocation != null) {
            String location = asTrimmedString(rawLocation);
            if (location == null || location.length() < 2 || location.length() > 150) {
                throw new ListingAccessException(
                        HttpStatus.BAD_REQUEST,
                        "Pickup location must be between 2 and 150 characters."
                );
            }
            setClauses.add("pickup_location = ?");
            params.add(location);
        }

        Object rawStatus = firstPresent(updates, "listing_status", "listingStatus", "status");
        if (rawStatus != null) {
            String matchedStatus = matchAllowed(ALLOWED_STATUSES, String.valueOf(rawStatus));
            if (matchedStatus == null) {
                throw new ListingAccessException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid listing_status. Allowed values: " + String.join(", ", ALLOWED_STATUSES) + "."
                );
            }
            setClauses.add("listing_status = ?");
            params.add(matchedStatus);
        }

        if (setClauses.isEmpty()) {
            throw new ListingAccessException(
                    HttpStatus.BAD_REQUEST,
                    "No valid mutable fields provided. Updatable fields: title, description, current_asking_price, item_condition, pickup_location, listing_status."
            );
        }

        String updateSql = "UPDATE product_listings SET "
                + String.join(", ", setClauses)
                + ", updated_at = NOW() WHERE listing_id = ?";

        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(updateSql)) {

            int idx = 1;
            for (Object param : params) {
                if (param instanceof Double d) {
                    ps.setDouble(idx++, d);
                } else {
                    ps.setString(idx++, String.valueOf(param));
                }
            }
            ps.setLong(idx, listingId);

            int updatedRows = ps.executeUpdate();
            if (updatedRows == 0) {
                throw new ListingAccessException(HttpStatus.NOT_FOUND, "Listing not found.");
            }
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (SQLException ex) {
            throw new ListingAccessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Database error while updating listing.",
                    ex
            );
        }

        return getListingDetail(listingId, requester);
    }

    @Override
    public void deleteListing(long listingId, AuthenticatedUser requester) {
        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement("DELETE FROM product_listings WHERE listing_id = ?")) {

            ps.setLong(1, listingId);
            int deletedRows = ps.executeUpdate();
            if (deletedRows == 0) {
                throw new ListingAccessException(HttpStatus.NOT_FOUND, "Listing not found.");
            }
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (SQLException ex) {
            throw new ListingAccessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Database error while deleting listing.",
                    ex
            );
        }
    }

    private static ListingDto mapDetailRow(ResultSet rs) throws SQLException {
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

    private static Object firstPresent(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key) && map.get(key) != null) {
                return map.get(key);
            }
        }
        return null;
    }

    private static String asTrimmedString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static Double parseDouble(Object val) {
        if (val == null) {
            return null;
        }
        if (val instanceof Number num) {
            return num.doubleValue();
        }
        try {
            return Double.parseDouble(val.toString().trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String matchAllowed(List<String> allowed, String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        for (String candidate : allowed) {
            if (candidate.equalsIgnoreCase(trimmed)) {
                return candidate;
            }
        }
        return null;
    }
}
