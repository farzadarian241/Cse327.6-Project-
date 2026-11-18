"use client";

import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Clock,
  ShieldCheck,
  MapPin,
  Tag,
  Banknote,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "Electronic Devices", label: "Electronic Devices" },
  { value: "Furniture", label: "Furniture" },
  { value: "Clothing", label: "Clothing" },
];

const CONDITIONS = [
  { value: "Like New", label: "Like New", dotClass: "bg-emerald-500" },
  { value: "Good", label: "Good", dotClass: "bg-sky-500" },
  { value: "Fair", label: "Fair", dotClass: "bg-amber-500" },
  { value: "Needs Repair", label: "Needs Repair", dotClass: "bg-orange-500" },
];

const CAMPUS_AREAS = [
  "Bashundhara",
  "Dhanmondi",
  "Mohakhali",
  "Dhaka University",
  "Uttara",
  "Mirpur",
];

/**
 * Faceted Filter Sidebar for the HaatBodol Marketplace Browse page.
 * Supports desktop sticky sidebar and mobile collapsible drawer.
 * 100% English UI only.
 */
export default function FilterSidebar({
  filters = {},
  onFilterChange,
  onResetFilters,
  activeFilterCount = 0,
  totalResults = null,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Local controlled inputs for price & custom location so typing is smooth
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || "");
  const [locationInput, setLocationInput] = useState(filters.location || "");
  const [priceError, setPriceError] = useState("");

  // Sync local inputs when URL filters change externally (e.g. chip removal / reset)
  useEffect(() => {
    setMinPriceInput(filters.minPrice || "");
    setMaxPriceInput(filters.maxPrice || "");
    setPriceError("");
  }, [filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    setLocationInput(filters.location || "");
  }, [filters.location]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const handleApplyPrice = (e) => {
    if (e) e.preventDefault();
    const minStr = String(minPriceInput).trim();
    const maxStr = String(maxPriceInput).trim();

    if (minStr && (isNaN(Number(minStr)) || Number(minStr) < 0)) {
      setPriceError("Minimum price must be 0 or higher.");
      return;
    }
    if (maxStr && (isNaN(Number(maxStr)) || Number(maxStr) < 0)) {
      setPriceError("Maximum price must be 0 or higher.");
      return;
    }
    if (minStr && maxStr && Number(minStr) > Number(maxStr)) {
      setPriceError("Minimum price cannot exceed maximum price.");
      return;
    }

    setPriceError("");
    onFilterChange({
      minPrice: minStr,
      maxPrice: maxStr,
    });
  };

  const handleApplyLocation = (e) => {
    if (e) e.preventDefault();
    onFilterChange({ location: locationInput.trim() });
  };

  const handleCampusPresetClick = (area) => {
    const isSelected =
      (filters.location || "").toLowerCase() === area.toLowerCase();
    const nextLocation = isSelected ? "" : area;
    setLocationInput(nextLocation);
    onFilterChange({ location: nextLocation });
  };

  const handleConditionClick = (conditionValue) => {
    const nextCondition =
      filters.condition === conditionValue ? "" : conditionValue;
    onFilterChange({ condition: nextCondition });
  };

  const handleReset = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setLocationInput("");
    setPriceError("");
    if (onResetFilters) {
      onResetFilters();
    }
  };

  const renderFilterSections = () => (
    <div className="divide-y divide-gray-100">
      {/* 1. Category Filter */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Tag className="w-3.5 h-3.5 text-brand-teal" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
            Category
          </h3>
        </div>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isActive = (filters.category || "") === cat.value;
            return (
              <button
                key={cat.value || "all"}
                type="button"
                onClick={() => onFilterChange({ category: cat.value })}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                  isActive
                    ? "bg-teal-50 text-brand-teal font-bold border border-teal-200"
                    : "text-gray-700 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <span>{cat.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Price Range (BDT ৳) */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Banknote className="w-3.5 h-3.5 text-brand-teal" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
            Price Range (BDT ৳)
          </h3>
        </div>
        <form onSubmit={handleApplyPrice} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="filter-min-price"
                className="block text-[11px] font-medium text-gray-500 mb-1"
              >
                Min (৳)
              </label>
              <input
                id="filter-min-price"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={minPriceInput}
                onChange={(e) => {
                  setMinPriceInput(e.target.value);
                  if (priceError) setPriceError("");
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal tabular-nums"
              />
            </div>
            <div>
              <label
                htmlFor="filter-max-price"
                className="block text-[11px] font-medium text-gray-500 mb-1"
              >
                Max (৳)
              </label>
              <input
                id="filter-max-price"
                type="number"
                min="0"
                step="100"
                placeholder="Any"
                value={maxPriceInput}
                onChange={(e) => {
                  setMaxPriceInput(e.target.value);
                  if (priceError) setPriceError("");
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal tabular-nums"
              />
            </div>
          </div>

          {priceError && (
            <p className="text-[11px] text-rose-600 font-medium">{priceError}</p>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              className="flex-1 py-1.5 px-3 bg-[#232F3E] hover:bg-[#131921] text-white text-xs font-semibold rounded-md transition-colors"
            >
              Apply Price
            </button>
            {(filters.minPrice || filters.maxPrice) && (
              <button
                type="button"
                onClick={() => {
                  setMinPriceInput("");
                  setMaxPriceInput("");
                  setPriceError("");
                  onFilterChange({ minPrice: "", maxPrice: "" });
                }}
                className="py-1.5 px-2.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title="Clear price range"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Item Condition */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Condition
            </h3>
          </div>
          {filters.condition && (
            <button
              type="button"
              onClick={() => onFilterChange({ condition: "" })}
              className="text-[11px] font-medium text-brand-teal hover:underline"
            >
              Any
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CONDITIONS.map((cond) => {
            const isSelected = filters.condition === cond.value;
            return (
              <button
                key={cond.value}
                type="button"
                onClick={() => handleConditionClick(cond.value)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                  isSelected
                    ? "bg-teal-50 border-brand-teal text-brand-teal font-semibold shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cond.dotClass}`} />
                <span className="truncate">{cond.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Campus / Pickup Area */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-teal" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Campus / Pickup Area
            </h3>
          </div>
          {filters.location && (
            <button
              type="button"
              onClick={() => {
                setLocationInput("");
                onFilterChange({ location: "" });
              }}
              className="text-[11px] font-medium text-brand-teal hover:underline"
            >
              Any
            </button>
          )}
        </div>

        {/* Quick campus pills */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {CAMPUS_AREAS.map((area) => {
            const isSelected =
              (filters.location || "").toLowerCase() === area.toLowerCase();
            return (
              <button
                key={area}
                type="button"
                onClick={() => handleCampusPresetClick(area)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  isSelected
                    ? "bg-brand-teal text-white border-brand-teal shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>

        {/* Free-text pickup area input */}
        <form onSubmit={handleApplyLocation} className="flex gap-1.5">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Custom area (e.g. NSU, BRACU)"
            aria-label="Filter by campus or pickup area"
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md transition-colors flex-shrink-0"
          >
            Go
          </button>
        </form>
      </div>

      {/* 5. Special Toggles: Auto-Drop & Campus Verified */}
      <div className="p-4 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">
          Marketplace Features
        </h3>

        {/* Auto-Drop Active Toggle */}
        <label
          className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
            filters.autodrop
              ? "bg-amber-50 border-amber-300 shadow-sm"
              : "bg-gray-50/70 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-start gap-2 min-w-0">
            <Clock
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                filters.autodrop ? "text-brand-amber" : "text-gray-400"
              }`}
            />
            <div className="min-w-0">
              <span className="block text-xs font-bold text-gray-900">
                Auto-Drop Active
              </span>
              <span className="block text-[11px] text-gray-500 leading-snug">
                Dutch auction items dropping -5% weekly
              </span>
            </div>
          </div>
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={Boolean(filters.autodrop)}
              onChange={(e) => onFilterChange({ autodrop: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-brand-amber transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
        </label>

        {/* Campus Verified Seller Toggle */}
        <label
          className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
            filters.verified
              ? "bg-teal-50 border-teal-300 shadow-sm"
              : "bg-gray-50/70 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-start gap-2 min-w-0">
            <ShieldCheck
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                filters.verified ? "text-brand-teal" : "text-gray-400"
              }`}
            />
            <div className="min-w-0">
              <span className="block text-xs font-bold text-gray-900">
                Campus Verified Seller
              </span>
              <span className="block text-[11px] text-gray-500 leading-snug">
                Official .edu / .edu.bd verified students
              </span>
            </div>
          </div>
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={Boolean(filters.verified)}
              onChange={(e) => onFilterChange({ verified: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-brand-teal transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
        </label>
      </div>

      {/* 6. Clear All Filters Button */}
      <div className="p-4 bg-gray-50/70">
        <button
          type="button"
          onClick={handleReset}
          disabled={activeFilterCount === 0}
          className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
            activeFilterCount > 0
              ? "bg-white hover:bg-rose-50 text-rose-600 border-rose-200 shadow-sm"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>
            Clear All Filters
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Collapsible Filter Trigger Bar */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-colors"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <SlidersHorizontal className="w-4 h-4 text-brand-teal" />
            <span>Filter Listings</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center bg-brand-amber text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-teal">
            <span>{mobileOpen ? "Hide" : "Show Filters"}</span>
            {mobileOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {/* Mobile Slide-Over Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">
              <div className="bg-[#131921] text-white px-4 py-3.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-amber" />
                  <h2 className="text-sm font-bold">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-brand-amber text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  aria-label="Close filter drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">{renderFilterSections()}</div>

              <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 px-4 bg-brand-teal hover:bg-brand-tealHover text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                >
                  {totalResults !== null
                    ? `Show ${totalResults} Result${totalResults === 1 ? "" : "s"}`
                    : "Apply & Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-28">
          <div className="bg-[#131921] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-amber" />
              <h2 className="text-sm font-bold tracking-tight">Filter Results</h2>
            </div>
            {activeFilterCount > 0 && (
              <span className="bg-brand-amber text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {activeFilterCount} Active
              </span>
            )}
          </div>
          {renderFilterSections()}
        </div>
      </aside>
    </>
  );
}
