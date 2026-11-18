package com.haatbodol.patterns.decorator;

import com.haatbodol.model.ListingDto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * <h2>Pattern 8: Decorator Pattern — {@code SavingsBadgeDecorator}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteDecorator} — computes the
 * retail discount amount and percentage off the original purchase price. When
 * savings are at least <strong>10%</strong>, attaches a {@code savingsBadge} along
 * with structured {@code pricingMeta}.</p>
 */
public class SavingsBadgeDecorator extends ListingPresentationDecorator {

    private static final int MIN_BADGE_SAVINGS_PERCENT = 10;

    public SavingsBadgeDecorator(ListingPresentationComponent wrappedComponent) {
        super(wrappedComponent);
    }

    @Override
    protected void applyDecoration(Map<String, Object> decorators) {
        ListingDto listing = getBaseListing();
        double orig = listing.getOriginalPrice() != null ? listing.getOriginalPrice() : 0.0;
        double current = listing.getCurrentAskingPrice() != null ? listing.getCurrentAskingPrice() : 0.0;

        long savingsAmount = orig > current ? Math.round(orig - current) : 0L;
        long savingsPercent = orig > 0.0 ? Math.round(((double) savingsAmount / orig) * 100.0) : 0L;
        boolean isDiscounted = savingsPercent >= MIN_BADGE_SAVINGS_PERCENT;

        Map<String, Object> savingsBadge = null;
        if (isDiscounted) {
            savingsBadge = new LinkedHashMap<>();
            savingsBadge.put("label", "Save " + savingsPercent + "% off retail");
            savingsBadge.put("percentage", savingsPercent);
            savingsBadge.put("amount", savingsAmount);
        }

        Map<String, Object> pricingMeta = new LinkedHashMap<>();
        pricingMeta.put("originalPrice", orig);
        pricingMeta.put("currentAskingPrice", current);
        pricingMeta.put("savingsAmount", savingsAmount);
        pricingMeta.put("savingsPercentage", savingsPercent);
        pricingMeta.put("isDiscounted", isDiscounted);
        pricingMeta.put("formattedOriginalPrice", formatTaka(orig));
        pricingMeta.put("formattedCurrentPrice", formatTaka(current));
        pricingMeta.put("formattedSavings", savingsAmount > 0 ? formatTaka(savingsAmount) : "\u09F30");

        decorators.put("savingsBadge", savingsBadge);
        decorators.put("pricingMeta", pricingMeta);
    }
}
