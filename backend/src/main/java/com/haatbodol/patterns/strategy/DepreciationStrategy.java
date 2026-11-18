package com.haatbodol.patterns.strategy;

import com.haatbodol.model.DepreciationEstimate;

/**
 * <h2>Pattern 2: Strategy Pattern — {@code DepreciationStrategy}</h2>
 *
 * <p><strong>GoF Classification:</strong> Behavioral Pattern (Strategy)</p>
 * <p><strong>GoF Participant:</strong> {@code Strategy} (Interface) — declares the
 * common algorithm interface shared by all category-specific resale depreciation
 * strategies ({@link ElectronicsDepreciationStrategy}, {@link FurnitureDepreciationStrategy},
 * and {@link ClothingDepreciationStrategy}).</p>
 *
 * <p>The {@link DepreciationContext} interacts strictly with this interface so
 * pricing formulas can be swapped dynamically at runtime without conditional branching.</p>
 */
public interface DepreciationStrategy {

    /**
     * Calculates the fair resale value range, baseline price, depreciation percentage,
     * and human-readable explanation for an item in this strategy's category.
     *
     * @param originalPrice original retail purchase price in BDT
     * @param ageInMonths   age of the item in months since original purchase
     * @param condition     physical condition label ({@code "Like New"}, {@code "Good"},
     *                      {@code "Fair"}, or {@code "Needs Repair"})
     * @return structured {@link DepreciationEstimate} result
     */
    DepreciationEstimate calculate(double originalPrice, int ageInMonths, String condition);

    /**
     * Returns the canonical marketplace category name handled by this strategy
     * (e.g., {@code "Electronic Devices"}, {@code "Furniture"}, {@code "Clothing"}).
     *
     * @return canonical category name
     */
    String getCategoryName();
}
