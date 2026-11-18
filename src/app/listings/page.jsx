"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  ArrowUpDown,
  PackageOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  MapPin,
  Tag,
  Banknote,
  Sparkles,
} from "lucide-react";
import FilterSidebar from "@/components/listings/FilterSidebar";
import ProductCard from "@/components/listings/ProductCard";

const PAGE_LIMIT = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Listed" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "soonest_drop", label: "Soonest Auto-Drop" },
];

const VALID_SORTS = new Set(SORT_OPTIONS.map((o) => o.value));

function parseBoolParam(val) {
  if (!val) return false;
  const lower = String(val).trim().toLowerCase();
  return lower === "true" || lower === "1" || lower === "yes";
}

function ListingsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm animate-pulse"
        >
          <div className="w-full aspect-[4/3] bg-gray-200" />
          <div className="p-3.5 space-y-2.5">
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mt-2" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <div className="h-7 bg-gray-200 rounded flex-1" />
              <div className="h-7 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListingsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-gray-200 rounded-xl" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block w-72 h-[540px] bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-14 bg-gray-200 rounded-xl" />
          <ListingsGridSkeleton />
        </div>
      </div>
    </div>
  );
}

function ListingsBrowserContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive normalized filter state directly from URL query parameters
  const filters = useMemo(() => {
    const rawQ = searchParams.get("q") ?? searchParams.get("search") ?? "";
    const rawCategory = searchParams.get("category") ?? "";
    const rawMinPrice = searchParams.get("minPrice") ?? "";
    const rawMaxPrice = searchParams.get("maxPrice") ?? "";
    const rawCondition = searchParams.get("condition") ?? "";
    const rawLocation = searchParams.get("location") ?? "";
    const rawAutodrop = parseBoolParam(searchParams.get("autodrop"));
    const rawVerified = parseBoolParam(searchParams.get("verified"));
    const rawSort = searchParams.get("sort") ?? "newest";
    const safeSort = VALID_SORTS.has(rawSort) ? rawSort : "newest";
    const parsedPage = parseInt(searchParams.get("page") ?? "1", 10);
    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    return {
      q: rawQ.trim(),
      category: rawCategory === "all" ? "" : rawCategory.trim(),
      minPrice: rawMinPrice.trim(),
      maxPrice: rawMaxPrice.trim(),
      condition: rawCondition.trim(),
      location: rawLocation.trim(),
      autodrop: rawAutodrop,
      verified: rawVerified,
      sort: safeSort,
      page: safePage,
    };
  }, [searchParams]);

  // Controlled search box state synced with URL `q`
  const [searchInput, setSearchInput] = useState(filters.q);
  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  // Listing fetch state
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({
    count: 0,
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  // Build URL search string from a complete filter object
  const pushFilterUrl = useCallback(
    (nextFilters, { scrollTop = false } = {}) => {
      const params = new URLSearchParams();
      if (nextFilters.q) params.set("q", nextFilters.q);
      if (nextFilters.category) params.set("category", nextFilters.category);
      if (nextFilters.minPrice) params.set("minPrice", nextFilters.minPrice);
      if (nextFilters.maxPrice) params.set("maxPrice", nextFilters.maxPrice);
      if (nextFilters.condition) params.set("condition", nextFilters.condition);
      if (nextFilters.location) params.set("location", nextFilters.location);
      if (nextFilters.autodrop) params.set("autodrop", "true");
      if (nextFilters.verified) params.set("verified", "true");
      if (nextFilters.sort && nextFilters.sort !== "newest") {
        params.set("sort", nextFilters.sort);
      }
      if (nextFilters.page && nextFilters.page > 1) {
        params.set("page", String(nextFilters.page));
      }

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: scrollTop });
      if (scrollTop && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [pathname, router]
  );

  const handleFilterChange = useCallback(
    (updates) => {
      const next = {
        ...filters,
        ...updates,
        // Always reset to page 1 when changing any filter or sort
        page: updates.page !== undefined ? updates.page : 1,
      };
      pushFilterUrl(next, { scrollTop: updates.page !== undefined });
    },
    [filters, pushFilterUrl]
  );

  const handleResetFilters = useCallback(() => {
    setSearchInput("");
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange({ q: searchInput.trim() });
  };

  // Fetch filtered listings from Java Spring Boot backend via Next.js /api rewrite
  useEffect(() => {
    const controller = new AbortController();

    async function fetchListings() {
      setLoading(true);
      setError("");

      const apiParams = new URLSearchParams();
      if (filters.q) apiParams.set("q", filters.q);
      if (filters.category) apiParams.set("category", filters.category);
      if (filters.minPrice) apiParams.set("minPrice", filters.minPrice);
      if (filters.maxPrice) apiParams.set("maxPrice", filters.maxPrice);
      if (filters.condition) apiParams.set("condition", filters.condition);
      if (filters.location) apiParams.set("location", filters.location);
      if (filters.autodrop) apiParams.set("autodrop", "true");
      if (filters.verified) apiParams.set("verified", "true");
      if (filters.sort) apiParams.set("sort", filters.sort);
      apiParams.set("page", String(filters.page));
      apiParams.set("limit", String(PAGE_LIMIT));

      try {
        const res = await fetch(`/api/listings?${apiParams.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.message || data.error || `Failed to load listings (HTTP ${res.status}).`
          );
        }

        const list = Array.isArray(data.listings) ? data.listings : [];
        const total =
          typeof data.total === "number"
            ? data.total
            : typeof data.count === "number"
            ? data.count
            : list.length;
        const limit = typeof data.limit === "number" && data.limit > 0 ? data.limit : PAGE_LIMIT;
        const page = typeof data.page === "number" && data.page > 0 ? data.page : filters.page;
        const totalPages =
          typeof data.totalPages === "number" && data.totalPages > 0
            ? data.totalPages
            : Math.max(1, Math.ceil(total / limit));

        setListings(list);
        setMeta({
          count: typeof data.count === "number" ? data.count : list.length,
          total,
          page,
          limit,
          totalPages,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Unable to load marketplace listings. Please try again.");
        setListings([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchListings();
    return () => controller.abort();
  }, [filters, reloadTick]);

  // Build active filter chips for quick removal
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.q) {
      chips.push({
        key: "q",
        label: `Search: "${filters.q}"`,
        icon: Search,
        onRemove: () => handleFilterChange({ q: "" }),
      });
    }
    if (filters.category) {
      chips.push({
        key: "category",
        label: filters.category,
        icon: Tag,
        onRemove: () => handleFilterChange({ category: "" }),
      });
    }
    if (filters.minPrice || filters.maxPrice) {
      const priceLabel =
        filters.minPrice && filters.maxPrice
          ? `৳${Number(filters.minPrice).toLocaleString()} – ৳${Number(
              filters.maxPrice
            ).toLocaleString()}`
          : filters.minPrice
          ? `From ৳${Number(filters.minPrice).toLocaleString()}`
          : `Up to ৳${Number(filters.maxPrice).toLocaleString()}`;
      chips.push({
        key: "price",
        label: priceLabel,
        icon: Banknote,
        onRemove: () => handleFilterChange({ minPrice: "", maxPrice: "" }),
      });
    }
    if (filters.condition) {
      chips.push({
        key: "condition",
        label: `Condition: ${filters.condition}`,
        icon: Sparkles,
        onRemove: () => handleFilterChange({ condition: "" }),
      });
    }
    if (filters.location) {
      chips.push({
        key: "location",
        label: `Area: ${filters.location}`,
        icon: MapPin,
        onRemove: () => handleFilterChange({ location: "" }),
      });
    }
    if (filters.autodrop) {
      chips.push({
        key: "autodrop",
        label: "Auto-Drop Active",
        icon: Clock,
        styleClass: "bg-amber-50 text-amber-800 border-amber-300",
        onRemove: () => handleFilterChange({ autodrop: false }),
      });
    }
    if (filters.verified) {
      chips.push({
        key: "verified",
        label: "Campus Verified Only",
        icon: ShieldCheck,
        styleClass: "bg-teal-50 text-brand-teal border-teal-300",
        onRemove: () => handleFilterChange({ verified: false }),
      });
    }
    return chips;
  }, [filters, handleFilterChange]);

  // Compute pagination page numbers with ellipsis for clean navigation
  const paginationPages = useMemo(() => {
    const totalP = meta.totalPages || 1;
    const currentP = meta.page || 1;
    if (totalP <= 7) {
      return Array.from({ length: totalP }, (_, i) => i + 1);
    }
    const pages = new Set([1, totalP, currentP, currentP - 1, currentP + 1]);
    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= totalP)
      .sort((a, b) => a - b);

    const output = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        output.push("ellipsis-" + i);
      }
      output.push(sorted[i]);
    }
    return output;
  }, [meta.page, meta.totalPages]);

  const startIdx = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endIdx = Math.min(meta.total, (meta.page - 1) * meta.limit + listings.length);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Marketplace Browse Header & Inline Search Bar */}
      <section className="bg-gradient-to-r from-[#131921] via-[#232F3E] to-[#134E4A] text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-teal-300 font-semibold uppercase tracking-wider mb-1">
              <Link href="/" className="hover:underline text-gray-300">
                Home
              </Link>
              <span className="text-gray-500">/</span>
              <span>Campus Marketplace</span>
              {filters.category && (
                <>
                  <span className="text-gray-500">/</span>
                  <span className="text-amber-300">{filters.category}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {filters.category ? filters.category : "Browse Campus Marketplace"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Filter verified student listings by price, condition, Dhaka campus area, or active -5% Auto-Drop deals.
            </p>
          </div>

          <Link
            href="/listings/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-xs sm:text-sm font-bold shadow-sm transition-colors flex-shrink-0 self-start md:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Sell an Item</span>
          </Link>
        </div>

        {/* Dedicated Keyword Search Bar synced with URL ?q= */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-4 flex flex-col sm:flex-row gap-2 max-w-3xl"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search laptops, headphones, study desks, winter jackets, campus areas..."
              aria-label="Search marketplace listings"
              className="w-full pl-9 pr-9 py-2.5 text-sm text-gray-900 bg-white rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-amber shadow-inner"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  if (filters.q) handleFilterChange({ q: "" });
                }}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-amber hover:bg-brand-amberHover text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>
      </section>

      {/* Main Content Layout: Left Filter Sidebar + Right Results Area */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          activeFilterCount={activeChips.length}
          totalResults={loading ? null : meta.total}
        />

        {/* Right Column: Controls, Active Chips, Grid, Pagination */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Result Summary + Sort Toolbar */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700">
              {loading ? (
                <span className="text-gray-500 font-medium">Searching campus listings...</span>
              ) : meta.total > 0 ? (
                <span>
                  Showing{" "}
                  <strong className="text-gray-900 tabular-nums">
                    {startIdx}–{endIdx}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-gray-900 tabular-nums">{meta.total}</strong>{" "}
                  {meta.total === 1 ? "result" : "results"}
                  {filters.q && (
                    <span>
                      {" "}
                      for <strong className="text-brand-teal">&ldquo;{filters.q}&rdquo;</strong>
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  <strong className="text-gray-900">0 results</strong> found
                  {filters.q && (
                    <span>
                      {" "}
                      for <strong className="text-brand-teal">&ldquo;{filters.q}&rdquo;</strong>
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label
                htmlFor="listings-sort"
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-brand-teal" />
                <span>Sort by:</span>
              </label>
              <select
                id="listings-sort"
                value={filters.sort}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                className="text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-1">
                Active Filters:
              </span>
              {activeChips.map((chip) => {
                const IconComp = chip.icon;
                return (
                  <span
                    key={chip.key}
                    className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold border ${
                      chip.styleClass || "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {IconComp && <IconComp className="w-3 h-3 flex-shrink-0" />}
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={`Remove ${chip.label} filter`}
                      className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}

              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-900">
                    Could not load marketplace listings
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReloadTick((t) => t + 1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Listings Grid / Skeletons / Empty State */}
          {loading ? (
            <ListingsGridSkeleton />
          ) : !error && listings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-14 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                No matching listings found
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
                {activeChips.length > 0
                  ? "Try broadening your price range, clearing one of your active filters, or searching for a different keyword."
                  : "There are currently no available items listed in the marketplace. Check back soon or list your own item!"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {activeChips.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-teal hover:bg-brand-tealHover text-white text-sm font-bold shadow-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset All Filters</span>
                  </button>
                )}
                <Link
                  href="/listings/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-sm font-bold shadow-sm transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post an Item</span>
                </Link>
              </div>
            </div>
          ) : !error ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map((listing) => (
                  <ProductCard key={listing.listing_id} listing={listing} />
                ))}
              </div>

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <nav
                  aria-label="Listings pagination"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <p className="text-xs text-gray-600">
                    Page <strong className="text-gray-900">{meta.page}</strong> of{" "}
                    <strong className="text-gray-900">{meta.totalPages}</strong>
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <button
                      type="button"
                      disabled={meta.page <= 1}
                      onClick={() => handleFilterChange({ page: meta.page - 1 })}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        meta.page <= 1
                          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {paginationPages.map((item) => {
                      if (typeof item === "string") {
                        return (
                          <span
                            key={item}
                            className="px-2 py-1 text-xs text-gray-400 select-none"
                          >
                            ...
                          </span>
                        );
                      }
                      const isCurrent = item === meta.page;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleFilterChange({ page: item })}
                          aria-current={isCurrent ? "page" : undefined}
                          className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold border transition-colors tabular-nums ${
                            isCurrent
                              ? "bg-[#131921] text-white border-[#131921] shadow-sm"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => handleFilterChange({ page: meta.page + 1 })}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        meta.page >= meta.totalPages
                          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsPageSkeleton />}>
      <ListingsBrowserContent />
    </Suspense>
  );
}
