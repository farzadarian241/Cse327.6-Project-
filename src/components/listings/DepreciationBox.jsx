"use client";

import React from "react";
import {
  TrendingDown,
  Sparkles,
  Calculator,
  CheckCircle2,
  Info,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

/**
 * DepreciationBox Component
 * Interactive widget displaying fair market resale valuation calculated via
 * Strategy Pattern depreciation algorithms.
 *
 * 100% English interface text only.
 */
export default function DepreciationBox({
  estimation = null,
  loading = false,
  error = null,
  onApplyPrice,
  currentPrice = "",
  className = "",
}) {
  // Safe helper to format BDT currency
  const formatBDT = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "৳0";
    return `৳${Math.round(Number(amount)).toLocaleString("en-US")}`;
  };

  // Safe helper to extract explanation items
  const renderExplanations = () => {
    if (!estimation || !estimation.explanation) {
      return (
        <li className="flex items-start gap-2 text-xs text-gray-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal mt-0.5 flex-shrink-0" />
          <span>Calculated using category-specific decay curve and condition multiplier.</span>
        </li>
      );
    }

    if (Array.isArray(estimation.explanation)) {
      return estimation.explanation.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal mt-0.5 flex-shrink-0" />
          <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
        </li>
      ));
    }

    const items = [];

    // Primary explanation from strategy engine
    if (typeof estimation.explanation === "string" && estimation.explanation.trim()) {
      const lines = estimation.explanation
        .split(/\n|•|\*/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      lines.forEach((line) => items.push(line));
    } else if (Array.isArray(estimation.explanation)) {
      estimation.explanation.forEach((item) => {
        items.push(typeof item === "string" ? item : JSON.stringify(item));
      });
    }

    // Add supplementary strategy factors for transparent breakdown
    if (estimation.condition) {
      items.push(
        `Condition Rating "${estimation.condition}": Multiplier applied to baseline market value.`
      );
    }
    if (estimation.ageInMonths !== undefined && estimation.ageInMonths !== null) {
      items.push(
        `Time Decay: Evaluated across ${estimation.ageInMonths} month(s) since original retail purchase.`
      );
    }
    items.push(
      "Value Floor Protection: Minimum resale threshold guaranteed at ≥10% of original retail price."
    );

    return items.map((text, idx) => (
      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
        <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal mt-0.5 flex-shrink-0" />
        <span>{text}</span>
      </li>
    ));
  };

  // 1. Loading State
  if (loading) {
    return (
      <div
        className={`border border-teal-200 bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40 rounded-xl p-5 shadow-sm transition-all ${className}`}
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center animate-spin">
            <RefreshCw className="w-3.5 h-3.5 text-brand-teal" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
            Calculating Market Valuation...
          </span>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-teal-100/70 rounded w-1/3"></div>
          <div className="h-8 bg-teal-100/50 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-teal-200/50 rounded-lg w-full mt-4"></div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div
        className={`border border-amber-200 bg-amber-50/50 rounded-xl p-4 shadow-sm ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900">
            <p className="font-semibold mb-0.5">Valuation Service Unavailable</p>
            <p className="text-amber-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty State (No estimation generated yet)
  if (!estimation || !estimation.suggestedMin) {
    return (
      <div
        className={`border border-dashed border-gray-300 bg-gray-50/80 rounded-xl p-5 text-center ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-2.5 text-gray-500">
          <Calculator className="w-5 h-5 text-gray-600" />
        </div>
        <h4 className="text-sm font-semibold text-gray-800 mb-1">
          Smart Resale Price Estimator
        </h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          Select category, condition, age, and enter the original retail price to receive
          an algorithmic fair resale price range powered by HaatBodol’s Depreciation Strategy Engine.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-medium text-brand-teal">
          <Sparkles className="w-3 h-3 text-brand-teal" />
          <span>Algorithmic pricing helps listings sell up to 40% faster</span>
        </div>
      </div>
    );
  }

  // 4. Populated Valuation State
  const minPrice = estimation.suggestedMin || 0;
  const maxPrice = estimation.suggestedMax || 0;
  const recommendedPrice =
    estimation.baselinePrice ||
    Math.round((Number(minPrice) + Number(maxPrice)) / 2);
  const depreciationPct =
    estimation.depreciationPercentage !== undefined
      ? Math.round(Number(estimation.depreciationPercentage))
      : null;

  const isCurrentPriceMatching =
    Number(currentPrice) > 0 &&
    Math.abs(Number(currentPrice) - Number(recommendedPrice)) < 2;

  return (
    <div
      className={`border border-teal-200 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/30 rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      {/* Header with Title and Strategy Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-teal-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-brand-teal">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 leading-tight">
              Fair Resale Value Range
            </h4>
            <p className="text-[11px] text-gray-500">
              Strategy: {estimation.category || "Item Category"} Engine
            </p>
          </div>
        </div>

        {/* Depreciation Percentage Badge */}
        {depreciationPct !== null && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <span>-{depreciationPct}% Depreciation</span>
          </div>
        )}
      </div>

      {/* Suggested Resale Price Range */}
      <div className="mb-4">
        <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
          Recommended Price Window
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-brand-teal tracking-tight tabular-nums">
            {formatBDT(minPrice)} – {formatBDT(maxPrice)}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            (Fair Campus Resale Value)
          </span>
        </div>

        {/* Target Benchmark Price */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-700 bg-white/80 border border-teal-100 rounded-lg px-3 py-1.5">
          <span className="font-semibold text-gray-900">Recommended Asking Price:</span>
          <span className="font-bold text-brand-teal font-mono text-sm">
            {formatBDT(recommendedPrice)}
          </span>
        </div>
      </div>

      {/* Explanation Factors from Strategy Calculation */}
      <div className="mb-4 bg-teal-50/50 rounded-lg p-3 border border-teal-100/70">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5 text-brand-teal" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
            Valuation Factors & Formula
          </span>
        </div>
        <ul className="space-y-1.5">{renderExplanations()}</ul>
      </div>

      {/* Action Buttons: Apply Recommended Price */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onApplyPrice && onApplyPrice(recommendedPrice)}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
            isCurrentPriceMatching
              ? "bg-teal-700 text-white cursor-default"
              : "bg-brand-teal hover:bg-brand-tealHover text-white active:scale-[0.99]"
          }`}
          aria-label={`Apply recommended price of ${formatBDT(recommendedPrice)}`}
        >
          {isCurrentPriceMatching ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Recommended Price Applied ({formatBDT(recommendedPrice)})</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Apply Recommended Price ({formatBDT(recommendedPrice)})</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </>
          )}
        </button>

        {/* Quick Min / Max buttons for flexibility */}
        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            type="button"
            onClick={() => onApplyPrice && onApplyPrice(minPrice)}
            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
            title="Set to minimum fair price for faster clearance"
          >
            Min ({formatBDT(minPrice)})
          </button>
          <button
            type="button"
            onClick={() => onApplyPrice && onApplyPrice(maxPrice)}
            className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
            title="Set to top of fair price window"
          >
            Max ({formatBDT(maxPrice)})
          </button>
        </div>
      </div>
    </div>
  );
}
