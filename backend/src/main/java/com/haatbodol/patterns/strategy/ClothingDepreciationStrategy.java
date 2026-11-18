package com.haatbodol.patterns.strategy;

/**
 * <h2>Pattern 2: Strategy Pattern — {@code ClothingDepreciationStrategy}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteStrategy} — models pre-owned
 * {@code "Clothing"} and apparel with an immediate <strong>45% pre-owned retail drop</strong>
 * plus a mild <strong>0.6% monthly fabric wear decay</strong>.</p>
 */
public class ClothingDepreciationStrategy extends AbstractDepreciationStrategy {

    private static final double INITIAL_RESALE_DROP = 0.45;
    private static final double MONTHLY_WEAR_RATE = 0.006;

    public ClothingDepreciationStrategy() {
        super("Clothing");
    }

    @Override
    protected double calculateAgeFactor(int ageInMonths) {
        double decayRatio = INITIAL_RESALE_DROP + (ageInMonths * MONTHLY_WEAR_RATE);
        return Math.max(0.0, 1.0 - decayRatio);
    }

    @Override
    protected String generateExplanation(
            double originalPrice,
            int ageInMonths,
            String condition,
            double conditionMultiplier,
            double ageFactor,
            double baselinePrice
    ) {
        String wearDecayPct = formatPercentage(ageInMonths * MONTHLY_WEAR_RATE * 100.0);
        long condPct = Math.round(conditionMultiplier * 100.0);
        return String.format(
                "Pre-owned apparel incurs an immediate 45%% retail resale discount plus mild monthly fabric wear (%s%% over %d mo), evaluated at %d%% for \"%s\" condition.",
                wearDecayPct,
                ageInMonths,
                condPct,
                condition
        );
    }
}
