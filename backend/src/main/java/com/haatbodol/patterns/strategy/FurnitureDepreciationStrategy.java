package com.haatbodol.patterns.strategy;

/**
 * <h2>Pattern 2: Strategy Pattern — {@code FurnitureDepreciationStrategy}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteStrategy} — models durable
 * household and dorm {@code "Furniture"} with a gradual <strong>0.8% monthly time decay</strong>,
 * where final resale value is weighted primarily by physical condition.</p>
 */
public class FurnitureDepreciationStrategy extends AbstractDepreciationStrategy {

    private static final double MONTHLY_DECAY_RATE = 0.008;

    public FurnitureDepreciationStrategy() {
        super("Furniture");
    }

    @Override
    protected double calculateAgeFactor(int ageInMonths) {
        double decayRatio = ageInMonths * MONTHLY_DECAY_RATE;
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
        String ageDecayPct = formatPercentage((1.0 - ageFactor) * 100.0);
        long condPct = Math.round(conditionMultiplier * 100.0);
        return String.format(
                "Furniture retains core structural value over time (gradual %s%% time decay over %d mo), with valuation heavily determined by \"%s\" physical condition (%d%% multiplier).",
                ageDecayPct,
                ageInMonths,
                condition,
                condPct
        );
    }
}
