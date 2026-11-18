package com.haatbodol.patterns.proxy;

import com.haatbodol.patterns.singleton.DatabasePool;
import com.haatbodol.security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

/**
 * <h2>Pattern 7: Protection Proxy — {@code ListingAccessProxy}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code Proxy} — wraps {@link RealListingAccessService}
 * and enforces HaatBodol's two core access-control invariants:</p>
 * <ol>
 *   <li><strong>Contact &amp; Visibility Privacy Gate on Reads:</strong> Hides {@code HIDDEN}
 *       listings from non-owners/non-admins (404), and masks {@code seller_phone},
 *       {@code seller_address}, and {@code seller_email} unless the requester is the listing
 *       owner, an active {@code ADMIN}, or a matched buyer on an accepted negotiation or
 *       completed transaction order.</li>
 *   <li><strong>Ownership / Admin Authorization Gate on Writes:</strong> Rejects unauthenticated
 *       (401) or unauthorized (403) {@code updateListing} and {@code deleteListing} calls
 *       <em>before</em> delegating to {@link RealListingAccessService}.</li>
 * </ol>
 */
@Service("listingAccessProxy")
@Primary
public class ListingAccessProxy implements ListingAccessService {

    public static final String MASKED_PHONE_LABEL = "Hidden until offer accepted";
    public static final String MASKED_CONTACT_REASON =
            "Protected by ListingAccessProxy — unlocks after offer acceptance";

    private final ListingAccessService realService;

    public ListingAccessProxy(@Qualifier("realListingAccessService") ListingAccessService realService) {
        this.realService = realService;
    }

    @Override
    public Map<String, Object> getListingDetail(long listingId, AuthenticatedUser requester) {
        Map<String, Object> listing = realService.getListingDetail(listingId, requester);

        long sellerId = toLong(listing.get("seller_id"));
        String listingStatus = listing.get("listing_status") != null
                ? String.valueOf(listing.get("listing_status"))
                : "AVAILABLE";
        String campusArea = listing.get("campus_area") != null
                ? String.valueOf(listing.get("campus_area"))
                : "";

        boolean isOwner = requester != null && requester.getUserId() == sellerId;
        boolean isAdmin = isVerifiedAdmin(requester);

        // Enforce HIDDEN visibility protection
        if ("HIDDEN".equalsIgnoreCase(listingStatus) && !isOwner && !isAdmin) {
            throw new ListingAccessException(HttpStatus.NOT_FOUND, "Listing not found.");
        }

        boolean isMatchedBuyer = false;
        if (requester != null && !isOwner && !isAdmin
                && ("RESERVED".equalsIgnoreCase(listingStatus) || "SOLD".equalsIgnoreCase(listingStatus))) {
            isMatchedBuyer = isMatchedBuyerForListing(listingId, requester.getUserId());
        }

        applyContactPolicy(listing, campusArea, isOwner, isAdmin, isMatchedBuyer);
        return listing;
    }

    @Override
    public Map<String, Object> updateListing(
            long listingId,
            Map<String, Object> updates,
            AuthenticatedUser requester
    ) {
        if (requester == null) {
            throw new ListingAccessException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required. Please sign in to modify a listing."
            );
        }

        long sellerId = requireListingSellerId(listingId);
        boolean isOwner = requester.getUserId() == sellerId;
        boolean isAdmin = isVerifiedAdmin(requester);

        if (!isOwner && !isAdmin) {
            throw new ListingAccessException(
                    HttpStatus.FORBIDDEN,
                    "Forbidden. Only the listing owner or an administrator may update this listing."
            );
        }

        Map<String, Object> updated = realService.updateListing(listingId, updates, requester);
        String campusArea = updated.get("campus_area") != null ? String.valueOf(updated.get("campus_area")) : "";
        applyContactPolicy(updated, campusArea, isOwner, isAdmin, false);
        return updated;
    }

    @Override
    public void deleteListing(long listingId, AuthenticatedUser requester) {
        if (requester == null) {
            throw new ListingAccessException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required. Please sign in to delete a listing."
            );
        }

        long sellerId = requireListingSellerId(listingId);
        boolean isOwner = requester.getUserId() == sellerId;
        boolean isAdmin = isVerifiedAdmin(requester);

        if (!isOwner && !isAdmin) {
            throw new ListingAccessException(
                    HttpStatus.FORBIDDEN,
                    "Forbidden. Only the listing owner or an administrator may delete this listing."
            );
        }

        realService.deleteListing(listingId, requester);
    }

    private void applyContactPolicy(
            Map<String, Object> listing,
            String campusArea,
            boolean isOwner,
            boolean isAdmin,
            boolean isMatchedBuyer
    ) {
        boolean canManage = isOwner || isAdmin;
        boolean contactUnlocked = isOwner || isAdmin || isMatchedBuyer;

        listing.put("is_owner", isOwner);
        listing.put("can_manage", canManage);
        listing.put("contact_unlocked", contactUnlocked);

        if (contactUnlocked) {
            String reason;
            if (isOwner) {
                reason = "Owner — Full seller contact visible to listing owner";
            } else if (isAdmin) {
                reason = "Admin — Full seller contact unlocked for moderation";
            } else {
                reason = "Matched Buyer — Contact unlocked via accepted offer or order";
            }
            listing.put("contact_mask_reason", reason);
        } else {
            String safeArea = (campusArea != null && !campusArea.isBlank()) ? campusArea.trim() : "Campus Area";
            listing.put("seller_phone", MASKED_PHONE_LABEL);
            listing.put("seller_address", safeArea + " (Exact address hidden until offer accepted)");
            listing.put("seller_email", null);
            listing.put("contact_mask_reason", MASKED_CONTACT_REASON);
        }
    }

    private long requireListingSellerId(long listingId) {
        String sql = "SELECT seller_id FROM product_listings WHERE listing_id = ? LIMIT 1";
        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, listingId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("seller_id");
                }
            }
            throw new ListingAccessException(HttpStatus.NOT_FOUND, "Listing not found.");
        } catch (ListingAccessException ex) {
            throw ex;
        } catch (SQLException ex) {
            throw new ListingAccessException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Database error while verifying listing ownership.",
                    ex
            );
        }
    }

    /**
     * Checks whether the requester has an accepted negotiation session or a transaction order
     * for the target listing.
     */
    private boolean isMatchedBuyerForListing(long listingId, long buyerId) {
        String negSql = """
                SELECT 1
                FROM negotiation_sessions
                WHERE listing_id = ? AND buyer_id = ? AND session_status = 'ACCEPTED'
                LIMIT 1
                """;
        String orderSql = """
                SELECT 1
                FROM transaction_orders
                WHERE listing_id = ? AND buyer_id = ?
                LIMIT 1
                """;
        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(negSql)) {
                ps.setLong(1, listingId);
                ps.setLong(2, buyerId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return true;
                    }
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(orderSql)) {
                ps.setLong(1, listingId);
                ps.setLong(2, buyerId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return true;
                    }
                }
            }
            return false;
        } catch (SQLException ex) {
            return false;
        }
    }

    /**
     * Confirms admin status against the live {@code users} table so revoked or suspended
     * admin accounts cannot bypass protection checks via a stale JWT.
     */
    private boolean isVerifiedAdmin(AuthenticatedUser requester) {
        if (requester == null || !requester.isAdmin()) {
            return false;
        }
        String sql = "SELECT account_type, account_status FROM users WHERE user_id = ? LIMIT 1";
        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, requester.getUserId());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return "ADMIN".equalsIgnoreCase(rs.getString("account_type"))
                            && "ACTIVE".equalsIgnoreCase(rs.getString("account_status"));
                }
            }
            return false;
        } catch (SQLException ex) {
            return false;
        }
    }

    private static long toLong(Object val) {
        if (val instanceof Number num) {
            return num.longValue();
        }
        if (val != null) {
            try {
                return Long.parseLong(val.toString().trim());
            } catch (NumberFormatException ignored) {
                return -1L;
            }
        }
        return -1L;
    }
}
