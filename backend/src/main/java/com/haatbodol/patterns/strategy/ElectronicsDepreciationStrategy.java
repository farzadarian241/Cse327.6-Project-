package com.haatbodol.patterns.strategy;

/**
 * <h2>Pattern 2: Strategy Pattern — {@code ElectronicsDepreciationStrategy}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteStrategy} — models accelerated
 * technological obsolescence and battery degradation for {@code "Electronic Devices"}:
 * <strong>2.2% decay per month</strong> for the first 24 months, followed by
 * <strong>1.0% decay per month</strong> from month 25 onward.</p>
 */
public class ElectronicsDepreciationStrategy extends AbstractDepreciationStrategy {

    private static final double EARLY_MONTHLY_DECAY_RATE = 0.022;
    private static final double LATER_MONTHLY_DECAY_RATE = 0.010;
    private static final int ACCELERATED_MONTHS_THRESHOLD = 24;

    public ElectronicsDepreciationStrategy() {
        super("Electronic Devices");
    }

    @Override
    protected double calculateAgeFactor(int ageInMonths) {
        double decayRatio;
        if (ageInMonths <= ACCELERATED_MONTHS_THRESHOLD) {
            decayRatio = ageInMonths * EARLY_MONTHLY_DECAY_RATE;
        } else {
            decayRatio = (ACCELERATED_MONTHS_THRESHOLD * EARLY_MONTHLY_DECAY_RATE)
                    + ((ageInMonths - ACCELERATED_MONTHS_THRESHOLD) * LATER_MONTHLY_DECAY_RATE);
        }
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
                "Electronics experience accelerated decay (%s%% over %d mo) due to fast technological updates, adjusted by %d%% for \"%s\" condition.",
                ageDecayPct,
                ageInMonths,
                condPct,
                condition
        );
    }
}
