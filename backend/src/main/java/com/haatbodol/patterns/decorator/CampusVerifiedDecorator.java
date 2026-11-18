package com.haatbodol.patterns.decorator;

import com.haatbodol.model.ListingDto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * <h2>Pattern 8: Decorator Pattern — {@code CampusVerifiedDecorator}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteDecorator} — evaluates
 * institutional verification status on the listing's seller and attaches a
 * {@code campusVerifiedBadge} trust indicator when verified.</p>
 */
public class CampusVerifiedDecorator extends ListingPresentationDecorator {

    public CampusVerifiedDecorator(ListingPresentationComponent wrappedComponent) {
        super(wrappedComponent);
    }

    @Override
    protected void applyDecoration(Map<String, Object> decorators) {
        ListingDto listing = getBaseListing();
        if (Boolean.TRUE.equals(listing.getIsCampusVerified())) {
            Map<String, Object> verifiedBadge = new LinkedHashMap<>();
            verifiedBadge.put("label", "Campus Verified Seller");
            verifiedBadge.put("verified", true);
            verifiedBadge.put("tooltip", "Verified university student/staff identity");
            decorators.put("campusVerifiedBadge", verifiedBadge);
        } else {
            decorators.put("campusVerifiedBadge", null);
        }
    }
}
