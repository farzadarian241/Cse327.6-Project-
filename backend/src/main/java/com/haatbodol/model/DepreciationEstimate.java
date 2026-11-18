package com.haatbodol.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Objects;

/**
 * Immutable-style Data Transfer Object (DTO) representing the output of the
 * Strategy Pattern depreciation engine ({@code com.haatbodol.patterns.strategy}).
 *
 * <p>JSON property names match the camelCase contract expected by the Next.js
 * {@code DepreciationBox.jsx} component.</p>
 */
public class DepreciationEstimate {

    @JsonProperty("category")
    private String category;

    @JsonProperty("originalPrice")
    private double originalPrice;

    @JsonProperty("ageInMonths")
    private int ageInMonths;

    @JsonProperty("condition")
    private String condition;

    @JsonProperty("suggestedMin")
    private double suggestedMin;

    @JsonProperty("suggestedMax")
    private double suggestedMax;

    @JsonProperty("baselinePrice")
    private double baselinePrice;

    @JsonProperty("depreciationPercentage")
    private double depreciationPercentage;

    @JsonProperty("explanation")
    private String explanation;

    public DepreciationEstimate() {
    }

    public DepreciationEstimate(
            String category,
            double originalPrice,
            int ageInMonths,
            String condition,
            double suggestedMin,
            double suggestedMax,
            double baselinePrice,
            double depreciationPercentage,
            String explanation
    ) {
        this.category = category;
        this.originalPrice = originalPrice;
        this.ageInMonths = ageInMonths;
        this.condition = condition;
        this.suggestedMin = suggestedMin;
        this.suggestedMax = suggestedMax;
        this.baselinePrice = baselinePrice;
        this.depreciationPercentage = depreciationPercentage;
        this.explanation = explanation;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(double originalPrice) {
        this.originalPrice = originalPrice;
    }

    public int getAgeInMonths() {
        return ageInMonths;
    }

    public void setAgeInMonths(int ageInMonths) {
        this.ageInMonths = ageInMonths;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public double getSuggestedMin() {
        return suggestedMin;
    }

    public void setSuggestedMin(double suggestedMin) {
        this.suggestedMin = suggestedMin;
    }

    public double getSuggestedMax() {
        return suggestedMax;
    }

    public void setSuggestedMax(double suggestedMax) {
        this.suggestedMax = suggestedMax;
    }

    public double getBaselinePrice() {
        return baselinePrice;
    }

    public void setBaselinePrice(double baselinePrice) {
        this.baselinePrice = baselinePrice;
    }

    public double getDepreciationPercentage() {
        return depreciationPercentage;
    }

    public void setDepreciationPercentage(double depreciationPercentage) {
        this.depreciationPercentage = depreciationPercentage;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DepreciationEstimate that)) {
            return false;
        }
        return Double.compare(that.originalPrice, originalPrice) == 0
                && ageInMonths == that.ageInMonths
                && Double.compare(that.suggestedMin, suggestedMin) == 0
                && Double.compare(that.suggestedMax, suggestedMax) == 0
                && Double.compare(that.baselinePrice, baselinePrice) == 0
                && Double.compare(that.depreciationPercentage, depreciationPercentage) == 0
                && Objects.equals(category, that.category)
                && Objects.equals(condition, that.condition)
                && Objects.equals(explanation, that.explanation);
    }

    @Override
    public int hashCode() {
        return Objects.hash(
                category,
                originalPrice,
                ageInMonths,
                condition,
                suggestedMin,
                suggestedMax,
                baselinePrice,
                depreciationPercentage,
                explanation
        );
    }

    @Override
    public String toString() {
        return "DepreciationEstimate{"
                + "category='" + category + '\''
                + ", originalPrice=" + originalPrice
                + ", ageInMonths=" + ageInMonths
                + ", condition='" + condition + '\''
                + ", suggestedMin=" + suggestedMin
                + ", suggestedMax=" + suggestedMax
                + ", baselinePrice=" + baselinePrice
                + ", depreciationPercentage=" + depreciationPercentage
                + ", explanation='" + explanation + '\''
                + '}';
    }
}
