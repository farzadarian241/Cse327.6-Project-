package com.haatbodol.patterns.strategy;

import com.haatbodol.model.DepreciationEstimate;

import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * <h2>Pattern 2: Strategy Pattern — {@code DepreciationContext}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code Context} — maintains a reference to a
 * {@link DepreciationStrategy} object, allows runtime strategy swapping via
 * {@link #setStrategy(DepreciationStrategy)}, resolves the right concrete strategy
 * for any marketplace category string via {@link #resolveStrategy(String)}, and
 * delegates valuation execution to the selected strategy.</p>
 */
public class DepreciationContext {

    private volatile DepreciationStrategy strategy;
    private final Map<String, DepreciationStrategy> strategyRegistry = new ConcurrentHashMap<>();

    public DepreciationContext() {
        DepreciationStrategy electronics = new ElectronicsDepreciationStrategy();
        DepreciationStrategy furniture = new FurnitureDepreciationStrategy();
        DepreciationStrategy clothing = new ClothingDepreciationStrategy();

        // Standard marketplace categories
        registerStrategy("Electronic Devices", electronics);
        registerStrategy("Furniture", furniture);
        registerStrategy("Clothing", clothing);

        // Common case-insensitive aliases
        registerStrategy("electronics", electronics);
        registerStrategy("electronic", electronics);
        registerStrategy("gadgets", electronics);
        registerStrategy("furniture", furniture);
        registerStrategy("clothing", clothing);
        registerStrategy("apparel", clothing);
        registerStrategy("clothes", clothing);

        // Default active strategy
        this.strategy = electronics;
    }

    /**
     * Constructs a context pre-configured with a specific strategy.
     *
     * @param initialStrategy initial {@link DepreciationStrategy} to hold
     */
    public DepreciationContext(DepreciationStrategy initialStrategy) {
        this();
        setStrategy(initialStrategy);
    }

    /**
     * Registers or overrides a strategy for a category key (case-insensitive).
     *
     * @param categoryKey category label or alias
     * @param strategy    concrete strategy implementation
     */
    public void registerStrategy(String categoryKey, DepreciationStrategy strategy) {
        Objects.requireNonNull(categoryKey, "categoryKey must not be null");
        Objects.requireNonNull(strategy, "strategy must not be null");
        strategyRegistry.put(categoryKey.trim().toLowerCase(Locale.ROOT), strategy);
    }

    /**
     * Dynamically switches the active {@link DepreciationStrategy} on this context.
     *
     * @param strategy new strategy to execute
     */
    public void setStrategy(DepreciationStrategy strategy) {
        this.strategy = Objects.requireNonNull(strategy, "DepreciationStrategy must not be null");
    }

    /**
     * Returns the currently configured {@link DepreciationStrategy}.
     *
     * @return current strategy
     */
    public DepreciationStrategy getStrategy() {
        return strategy;
    }

    /**
     * Resolves the appropriate concrete {@link DepreciationStrategy} for a category name
     * or keyword alias, defaulting to {@link ElectronicsDepreciationStrategy}.
     *
     * @param category marketplace category name
     * @return matching {@link DepreciationStrategy}
     */
    public DepreciationStrategy resolveStrategy(String category) {
        if (category == null || category.isBlank()) {
            return strategyRegistry.get("electronic devices");
        }
        String key = category.trim().toLowerCase(Locale.ROOT);
        DepreciationStrategy exact = strategyRegistry.get(key);
        if (exact != null) {
            return exact;
        }

        if (key.contains("electron") || key.contains("device") || key.contains("gadget")
                || key.contains("phone") || key.contains("laptop")) {
            return strategyRegistry.get("electronic devices");
        }
        if (key.contains("furnit") || key.contains("desk") || key.contains("chair")
                || key.contains("table") || key.contains("bed")) {
            return strategyRegistry.get("furniture");
        }
        if (key.contains("cloth") || key.contains("wear") || key.contains("apparel")
                || key.contains("jacket") || key.contains("shoe")) {
            return strategyRegistry.get("clothing");
        }

        return strategyRegistry.get("electronic devices");
    }

    /**
     * Executes valuation using the currently active {@link DepreciationStrategy}.
     *
     * @param originalPrice original retail purchase price in BDT
     * @param ageInMonths   age of item in months
     * @param condition     physical condition label
     * @return {@link DepreciationEstimate} produced by the active strategy
     */
    public DepreciationEstimate calculate(double originalPrice, int ageInMonths, String condition) {
        return strategy.calculate(originalPrice, ageInMonths, condition);
    }

    /**
     * Resolves the strategy for {@code category}, sets it on the context, and executes
     * the depreciation calculation in a thread-safe manner.
     *
     * @param category      marketplace category name
     * @param originalPrice original retail purchase price in BDT
     * @param ageInMonths   age of item in months
     * @param condition     physical condition label
     * @return {@link DepreciationEstimate} produced by the resolved concrete strategy
     */
    public DepreciationEstimate calculate(String category, double originalPrice, int ageInMonths, String condition) {
        DepreciationStrategy resolved = resolveStrategy(category);
        setStrategy(resolved);
        return resolved.calculate(originalPrice, ageInMonths, condition);
    }
}
