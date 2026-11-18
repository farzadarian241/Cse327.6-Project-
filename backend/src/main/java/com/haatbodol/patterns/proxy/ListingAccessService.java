package com.haatbodol.patterns.proxy;

import com.haatbodol.security.AuthenticatedUser;

import java.util.Map;

/**
 * <h2>Pattern 7: Protection Proxy — {@code ListingAccessService}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code Subject} — defines the common listing detail,
 * update, and delete interface implemented identically by both
 * {@link RealListingAccessService} and {@link ListingAccessProxy}.</p>
 */
public interface ListingAccessService {

    /**
     * Fetches the full decorated listing payload, applying contact privacy controls according
     * to the requester's relationship to the listing.
     */
    Map<String, Object> getListingDetail(long listingId, AuthenticatedUser requester);

    /**
     * Updates mutable fields on a listing and returns the refreshed listing payload.
     */
    Map<String, Object> updateListing(long listingId, Map<String, Object> updates, AuthenticatedUser requester);

    /**
     * Permanently deletes a listing (cascading dependent records via MySQL foreign keys).
     */
    void deleteListing(long listingId, AuthenticatedUser requester);
}
