package com.haatbodol.patterns.strategy;

import com.haatbodol.model.DepreciationEstimate;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * <h2>Pattern 2: Strategy Pattern — {@code AbstractDepreciationStrategy}</h2>
 *
 * <p><strong>GoF Participant:</strong> Abstract Base Strategy (Template Helper) —
 * implements the shared valuation pipeline (condition multiplier lookup, 10% minimum
 * value floor protection, fair price window calculation, and depreciation percentage)
 * while delegating category-specific time-decay curves and explanations to concrete
 * strategy subclasses.</p>
 */
public abstract class AbstractDepreciationStrategy implements DepreciationStrategy {

    /**
     * Minimum floor ratio: pre-owned items never depreciate below 10% of retail price.
     */
    protected static final double MIN_FLOOR_RATIO = 0.10;

    /**
     * Shared physical condition multipliers applied across all product categories.
     */
    protected static final Map<String, Double> CONDITION_MULTIPLIERS;

    static {
        Map<String, Double> multipliers = new LinkedHashMap<>();
        multipliers.put("Like New", 0.92);
        multipliers.put("Good", 0.80);
        multipliers.put("Fair", 0.65);
        multipliers.put("Needs Repair", 0.45);
        CONDITION_MULTIPLIERS = Collections.unmodifiableMap(multipliers);
    }

    private final String categoryName;

    protected AbstractDepreciationStrategy(String categoryName) {
        this.categoryName = categoryName;
    }

    @Override
    public String getCategoryName() {
        return categoryName;
    }

    /**
     * Retrieves the physical condition multiplier with case-insensitive matching.
     * Defaults to {@code "Good"} ({@code 0.80}) when null or unrecognized.
     *
     * @param condition raw condition string
     * @return condition multiplier in {@code (0.0, 1.0]}
     */
    protected double getConditionMultiplier(String condition) {
        String canonical = getCanonicalCondition(condition);
        return CONDITION_MULTIPLIERS.getOrDefault(canonical, 0.80);
    }

    /**
     * Normalizes a condition string to canonical title case.
     * Defaults to {@code "Good"} when null or unrecognized.
     *
     * @param condition raw condition string
     * @return canonical condition label
     */
    protected String getCanonicalCondition(String condition) {
        if (condition == null || condition.isBlank()) {
            return "Good";
        }
        String normalized = condition.trim();
        for (String key : CONDITION_MULTIPLIERS.keySet()) {
            if (key.equalsIgnoreCase(normalized)) {
                return key;
            }
        }
        return "Good";
    }

    /**
     * Concrete strategies implement this hook to compute the retained value ratio
     * {@code [0.0, 1.0]} based on item age before applying physical condition.
     *
     * @param ageInMonths non-negative item age in months
     * @return value retention ratio between {@code 0.0} and {@code 1.0}
     */
    protected abstract double calculateAgeFactor(int ageInMonths);

    /**
     * Concrete strategies implement this hook to explain the category-specific
     * depreciation curve and condition multiplier to sellers.
     *
     * @param originalPrice       sanitized original retail price
     * @param ageInMonths         sanitized item age in months
     * @param condition           canonical condition label
     * @param conditionMultiplier resolved condition multiplier
     * @param ageFactor           retained value ratio from {@link #calculateAgeFactor(int)}
     * @param baselinePrice       final rounded baseline valuation
     * @return human-readable explanation sentence
     */
    protected abstract String generateExplanation(
            double originalPrice,
            int ageInMonths,
            String condition,
            double conditionMultiplier,
            double ageFactor,
            double baselinePrice
    );

    /**
     * Executes the complete fair resale depreciation valuation algorithm.
     */
    @Override
    public DepreciationEstimate calculate(double originalPrice, int ageInMonths, String condition) {
        double validPrice = Math.max(0.0, Double.isNaN(originalPrice) || Double.isInfinite(originalPrice) ? 0.0 : originalPrice);
        int validAge = Math.max(0, ageInMonths);
        String canonicalCondition = getCanonicalCondition(condition);
        double conditionMultiplier = getConditionMultiplier(canonicalCondition);

        // 1. Retained value ratio from category-specific age decay
        double ageFactor = calculateAgeFactor(validAge);

        // 2. Baseline value after time decay and physical condition multiplier
        double preConditionValue = validPrice * ageFactor;
        double calculatedBaseline = preConditionValue * conditionMultiplier;

        // 3. Enforce 10% minimum floor protection
        double floorPrice = Math.round(validPrice * MIN_FLOOR_RATIO * 100.0) / 100.0;
        if (calculatedBaseline < floorPrice) {
            calculatedBaseline = floorPrice;
        }

        // 4. Round baseline price to nearest whole taka
        double baselinePrice = Math.round(calculatedBaseline);

        // 5. Fair resale window: -8% to +7% around baseline (bounded by floor & original retail)
        double suggestedMin = Math.max(floorPrice, Math.round(baselinePrice * 0.92));
        double suggestedMax = Math.min(validPrice, Math.max(suggestedMin, Math.round(baselinePrice * 1.07)));

        // 6. Total depreciation percentage relative to original retail price (rounded to 2 decimals)
        double depreciationPercentage = validPrice > 0.0
                ? Math.round(((validPrice - baselinePrice) / validPrice) * 10000.0) / 100.0
                : 0.0;

        String explanation = generateExplanation(
                validPrice,
                validAge,
                canonicalCondition,
                conditionMultiplier,
                ageFactor,
                baselinePrice
        );

        return new DepreciationEstimate(
                categoryName,
                validPrice,
                validAge,
                canonicalCondition,
                suggestedMin,
                suggestedMax,
                baselinePrice,
                depreciationPercentage,
                explanation
        );
    }

    /**
     * Formats a percentage value rounded to one decimal place without a trailing {@code .0}
     * (e.g., {@code 26.0 -> "26"}, {@code 26.4 -> "26.4"}).
     */
    protected String formatPercentage(double percentage) {
        double rounded = Math.round(percentage * 10.0) / 10.0;
        if (rounded == Math.rint(rounded)) {
            return Long.toString((long) rounded);
        }
        return Double.toString(rounded);
    }
}
