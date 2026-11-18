"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ShieldCheck,
  Lock,
  Unlock,
  Phone,
  Mail,
  Home,
  ShoppingCart,
  CheckCircle2,
  Flag,
  TrendingDown,
  Sliders,
  Info,
  AlertTriangle,
  AlertCircle,
  Trash2,
  LayoutDashboard,
  Calendar,
  Tag,
  Sparkles,
  X,
  RefreshCw,
  Shield,
  LogIn,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import StarRating from "@/components/shared/StarRating";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const REPORT_REASONS = [
  "Suspected Scam or Fraud",
  "Misleading Condition or Photos",
  "Prohibited or Restricted Item",
  "Duplicate or Spam Listing",
  "Suspicious or Unrealistic Pricing",
  "Inappropriate Content",
  "Other",
];

function formatBDT(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${Math.round(num).toLocaleString("en-US")}`;
}

function formatAge(months) {
  const m = Number(months);
  if (!Number.isFinite(m) || m <= 0) return "Less than 1 month";
  if (m < 12) return `${m} ${m === 1 ? "month" : "months"}`;
  const years = Math.floor(m / 12);
  const rem = m % 12;
  const yearPart = `${years} ${years === 1 ? "year" : "years"}`;
  if (rem === 0) return yearPart;
  return `${yearPart}, ${rem} ${rem === 1 ? "month" : "months"}`;
}

function formatDateTime(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function resolveCategoryFallback(category) {
  const lower = (category || "").toLowerCase();
  if (lower.includes("elect")) return "/uploads/defaults/laptop.jpg";
  if (lower.includes("furn")) return "/uploads/defaults/study-desk.jpg";
  if (lower.includes("cloth")) return "/uploads/defaults/winter-jacket.jpg";
  return "/uploads/defaults/laptop.jpg";
}

function DetailPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      <div className="h-5 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] bg-gray-200 rounded-2xl" />
          <div className="flex gap-3">
            <div className="w-20 h-16 bg-gray-200 rounded-lg" />
            <div className="w-20 h-16 bg-gray-200 rounded-lg" />
            <div className="w-20 h-16 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-44 bg-gray-200 rounded-2xl" />
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id;

  const { user, loading: authLoading } = useAuth();
  const { addToCart, isInCart } = useCart();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Quick management state (owner / admin)
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [manageFeedback, setManageFeedback] = useState(null); // { type: 'success'|'error', text }
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Cart toast feedback
  const [cartToast, setCartToast] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(null);

  const fetchListing = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setNotFound(true);
        setListing(null);
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.message || data.error || `Failed to load listing (HTTP ${res.status}).`
        );
      }

      if (!data.listing) {
        setNotFound(true);
        setListing(null);
        return;
      }

      setListing(data.listing);
      setActiveImageIdx(0);
    } catch (err) {
      setError(err.message || "Unable to load listing details. Please try again.");
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (authLoading) return;
    fetchListing();
  }, [fetchListing, authLoading, user?.user_id, user?.account_type]);

  // Normalize gallery images array with fallback
  const galleryImages = useMemo(() => {
    if (!listing) return [];
    const urls = [];
    if (Array.isArray(listing.images)) {
      listing.images.forEach((img) => {
        const url = typeof img === "string" ? img : img?.image_url;
        if (url && typeof url === "string" && !urls.includes(url)) {
          urls.push(url);
        }
      });
    }
    if (listing.image_url && !urls.includes(listing.image_url)) {
      urls.unshift(listing.image_url);
    }
    if (urls.length === 0) {
      urls.push(resolveCategoryFallback(listing.category));
    }
    return urls;
  }, [listing]);

  const safeImageIdx =
    activeImageIdx >= 0 && activeImageIdx < galleryImages.length ? activeImageIdx : 0;

  // Handle owner/admin quick status update via PATCH /api/listings/{id}
  const handleStatusChange = async (newStatus) => {
    if (!listing || newStatus === listing.listing_status) return;
    setStatusUpdating(true);
    setManageFeedback(null);

    try {
      const res = await fetch(`/api/listings/${listing.listing_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to update listing status.");
      }

      if (data.listing) {
        setListing(data.listing);
      } else {
        setListing((prev) => (prev ? { ...prev, listing_status: newStatus } : prev));
      }
      setManageFeedback({
        type: "success",
        text: `Listing status updated to ${newStatus}.`,
      });
    } catch (err) {
      setManageFeedback({
        type: "error",
        text: err.message || "Could not update status.",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle owner/admin delete via DELETE /api/listings/{id}
  const handleDeleteListing = async () => {
    if (!listing) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/listings/${listing.listing_id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to delete listing.");
      }
      setDeleteModalOpen(false);
      router.push("/listings");
    } catch (err) {
      setDeleteError(err.message || "Could not delete this listing.");
    } finally {
      setDeleting(false);
    }
  };

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!listing) return;
    addToCart({
      listing_id: listing.listing_id,
      title: listing.title,
      current_asking_price: Number(listing.current_asking_price) || 0,
      original_price: Number(listing.original_price) || 0,
      image_url: galleryImages[0],
      category: listing.category,
      pickup_location: listing.pickup_location,
      condition: listing.item_condition,
      seller_name: listing.seller_name,
    });
    setCartToast(true);
    setTimeout(() => setCartToast(false), 2500);
  };

  // Handle Report Listing submission via POST /api/listings/{id}/report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!listing) return;
    setReportSubmitting(true);
    setReportError("");

    try {
      const res = await fetch(`/api/listings/${listing.listing_id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Could not submit your report. Please try again."
        );
      }

      setReportSuccess({
        reportId: data.report_id,
        message:
          data.message ||
          "Thank you. Your report has been submitted to the moderation queue for review.",
      });
      setReportDetails("");
    } catch (err) {
      setReportError(err.message || "Failed to submit report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const openReportModal = () => {
    setReportError("");
    setReportSuccess(null);
    setReportReason(REPORT_REASONS[0]);
    setReportDetails("");
    setReportModalOpen(true);
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-brand-amber">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Listing Not Found</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          This listing may have been removed, marked as hidden by its seller, or the URL is incorrect.
        </p>
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-teal hover:bg-brand-tealHover text-white text-sm font-bold shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">
          Unable to Load Listing
        </h1>
        <p className="text-sm text-gray-600 mb-6">{error || "An unexpected error occurred."}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={fetchListing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-tealHover text-white text-sm font-bold shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors"
          >
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const origPrice = Number(listing.original_price) || 0;
  const askingPrice = Number(listing.current_asking_price) || 0;
  const savingsAmount = origPrice > askingPrice ? Math.round(origPrice - askingPrice) : 0;
  const savingsPercent =
    origPrice > askingPrice ? Math.round(((origPrice - askingPrice) / origPrice) * 100) : 0;

  const decorators = listing.decorators || {};
  const isCampusVerified = Boolean(
    decorators?.campusVerifiedBadge?.verified ?? listing.is_campus_verified
  );
  const isAutoDropActive = Boolean(
    decorators?.autoDropBadge?.active ?? (listing.auto_drop_enabled && !listing.is_halted)
  );
  const autoDropNextPrice =
    decorators?.auctionMeta?.nextDropPrice ??
    decorators?.autoDropBadge?.nextDropPrice ??
    (askingPrice > 0
      ? Math.max(Number(listing.min_reserve_price) || 0, Math.round(askingPrice * 0.95))
      : null);

  const hasSuggestedRange =
    Number(listing.suggested_min_price) > 0 && Number(listing.suggested_max_price) > 0;
  const minOffer70 = Math.round(askingPrice * 0.7);
  const maxOffer85 = Math.round(askingPrice * 0.85);

  const contactUnlocked = Boolean(listing.contact_unlocked);
  const canManage = Boolean(listing.can_manage);
  const inCart = isInCart(listing.listing_id);
  const isAvailable = listing.listing_status === "AVAILABLE";

  // Determine how asking price compares to Strategy Engine fair range
  let fairRangeVerdict = null;
  if (hasSuggestedRange) {
    const sMin = Number(listing.suggested_min_price);
    const sMax = Number(listing.suggested_max_price);
    if (askingPrice < sMin) {
      fairRangeVerdict = {
        label: "Great Deal — Priced Below Fair Market Range",
        pillClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    } else if (askingPrice <= sMax) {
      fairRangeVerdict = {
        label: "Fair Campus Price — Within Recommended Range",
        pillClass: "bg-teal-100 text-brand-teal border-teal-200",
      };
    } else {
      fairRangeVerdict = {
        label: "Above Depreciation Benchmark — Negotiable",
        pillClass: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500"
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <Link href="/" className="hover:text-brand-teal font-medium">
            Home
          </Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-brand-teal font-medium">
            Marketplace
          </Link>
          {listing.category && (
            <>
              <span>/</span>
              <Link
                href={`/listings?category=${encodeURIComponent(listing.category)}`}
                className="hover:text-brand-teal font-medium"
              >
                {listing.category}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-800 font-semibold truncate max-w-[260px] sm:max-w-md">
            {listing.title}
          </span>
        </div>

        <Link
          href="/listings"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Listings</span>
        </Link>
      </nav>

      {/* Owner / Admin Quick Management Bar (Protected by ListingAccessProxy) */}
      {canManage && (
        <section className="bg-[#131921] text-white rounded-xl p-4 shadow-md border border-[#37475A]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-teal/20 border border-teal-500/40 text-teal-300">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    {listing.is_owner ? "Seller Management Controls" : "Admin Management Controls"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-teal-300 border border-white/15">
                    Authorized via ListingAccessProxy
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  Quickly update listing visibility, jump to your dashboard, or permanently delete this listing.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Status Selector */}
              <div className="flex items-center gap-1.5 bg-[#232F3E] border border-[#37475A] rounded-lg px-2.5 py-1.5">
                <label
                  htmlFor="quick-status-select"
                  className="text-[11px] font-semibold text-gray-300 whitespace-nowrap"
                >
                  Status:
                </label>
                <select
                  id="quick-status-select"
                  value={listing.listing_status}
                  disabled={statusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-[#131921] text-white text-xs font-bold rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-amber cursor-pointer disabled:opacity-60"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="HIDDEN">HIDDEN</option>
                  <option value="SOLD">SOLD</option>
                  {listing.listing_status === "RESERVED" && (
                    <option value="RESERVED">RESERVED</option>
                  )}
                </select>
              </div>

              <Link
                href="/dashboard?tab=listings"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#232F3E] hover:bg-[#2a3749] border border-[#37475A] text-xs font-semibold text-white transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
                <span>Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setDeleteError("");
                  setDeleteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Listing</span>
              </button>
            </div>
          </div>

          {manageFeedback && (
            <div
              className={`mt-3 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                manageFeedback.type === "success"
                  ? "bg-emerald-900/50 text-emerald-200 border border-emerald-500/40"
                  : "bg-rose-900/50 text-rose-200 border border-rose-500/40"
              }`}
            >
              <span>{manageFeedback.text}</span>
              <button
                type="button"
                onClick={() => setManageFeedback(null)}
                className="p-0.5 hover:opacity-75"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Main 2-Column Product Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Image Gallery + Description + Depreciation Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Image Gallery Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={galleryImages[safeImageIdx]}
                alt={`${listing.title} — photo ${safeImageIdx + 1}`}
                className="w-full h-full object-contain p-4 sm:p-6"
              />

              {/* Top-left Status & Condition Overlay Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                <Badge size="sm">{listing.listing_status}</Badge>
                <Badge variant="condition" size="sm">
                  {listing.item_condition}
                </Badge>
              </div>

              {/* Top-right Image Counter */}
              {galleryImages.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/65 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm tabular-nums">
                  {safeImageIdx + 1} / {galleryImages.length}
                </div>
              )}

              {/* Prev / Next Gallery Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === 0 ? galleryImages.length - 1 : prev - 1
                      )
                    }
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md border border-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === galleryImages.length - 1 ? 0 : prev + 1
                      )
                    }
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md border border-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2.5 overflow-x-auto">
                {galleryImages.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 bg-gray-50 flex-shrink-0 transition-all ${
                      idx === safeImageIdx
                        ? "border-brand-teal ring-2 ring-teal-200"
                        : "border-gray-200 opacity-75 hover:opacity-100 hover:border-gray-400"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details & Description Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
              Item Description & Specifications
            </h2>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3 text-brand-teal" />
                  Category
                </span>
                <p className="text-xs font-bold text-gray-900">{listing.category}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-brand-teal" />
                  Condition
                </span>
                <p className="text-xs font-bold text-gray-900">{listing.item_condition}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-brand-teal" />
                  Item Age
                </span>
                <p className="text-xs font-bold text-gray-900">
                  {formatAge(listing.age_in_months)}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-brand-teal" />
                  Listed On
                </span>
                <p className="text-xs font-bold text-gray-900">
                  {formatDateTime(listing.published_at) || "Recently"}
                </p>
              </div>
            </div>

            {/* Full Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Seller Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description || "No additional description provided by the seller."}
              </p>
            </div>

            {/* Pickup Location Banner */}
            <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 bg-teal-100 text-brand-teal rounded-lg flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                  Preferred Campus Pickup Location
                </h3>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {listing.pickup_location || "Dhaka Campus Area"}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Always inspect the item in person at a well-lit public campus landmark before completing handover.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Depreciation Fair Value Range Card (if available) */}
          {hasSuggestedRange && (
            <div className="bg-white border border-teal-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-teal-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 text-brand-teal rounded-lg border border-teal-200">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Fair Resale Depreciation Benchmark
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Calculated by HaatBodol&apos;s Strategy Pattern Valuation Engine
                    </p>
                  </div>
                </div>
                {fairRangeVerdict && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${fairRangeVerdict.pillClass}`}
                  >
                    {fairRangeVerdict.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-[11px] text-gray-500 font-medium">
                    Original Retail Price
                  </span>
                  <span className="text-base font-bold text-gray-700 tabular-nums">
                    {formatBDT(origPrice)}
                  </span>
                </div>
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200">
                  <span className="block text-[11px] text-brand-teal font-semibold">
                    Suggested Fair Range
                  </span>
                  <span className="text-base font-extrabold text-brand-teal tabular-nums">
                    {formatBDT(listing.suggested_min_price)} –{" "}
                    {formatBDT(listing.suggested_max_price)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-[11px] text-gray-500 font-medium">
                    Current Asking Price
                  </span>
                  <span className="text-base font-black text-gray-900 tabular-nums">
                    {formatBDT(askingPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): Pricing, Decorator Badges, Buyer Actions, Protection Proxy Privacy Card */}
        <div className="lg:col-span-5 space-y-5">
          {/* Primary Purchase & Decorator Summary Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            {/* Decorator Badges Strip */}
            <div className="flex flex-wrap items-center gap-1.5">
              {isCampusVerified && (
                <Badge variant="campus-verified" size="sm">
                  {decorators?.campusVerifiedBadge?.label || "Campus Verified Seller"}
                </Badge>
              )}
              {(decorators?.savingsBadge || savingsPercent > 0) && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>
                    {decorators?.savingsBadge?.label || `Save ${savingsPercent}% off retail`}
                  </span>
                </span>
              )}
              {isAutoDropActive && (
                <Badge variant="autodrop" size="sm">
                  {decorators?.autoDropBadge?.label || "Drops 5% Soon"}
                </Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug tracking-tight">
                {listing.title}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Listing #{listing.listing_id} &middot; {listing.category} &middot;{" "}
                {listing.item_condition}
              </p>
            </div>

            {/* Price Block */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-baseline flex-wrap gap-2.5">
                <span className="text-3xl font-black text-gray-900 tabular-nums">
                  {formatBDT(askingPrice)}
                </span>
                {origPrice > askingPrice && (
                  <span className="text-sm text-gray-400 line-through tabular-nums">
                    {formatBDT(origPrice)}
                  </span>
                )}
              </div>
              {savingsAmount > 0 && (
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  You save {formatBDT(savingsAmount)} ({savingsPercent}%) compared to original retail price
                </p>
              )}
            </div>

            {/* Auto-Drop Dutch Auction Details Banner */}
            {Boolean(listing.auto_drop_enabled) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-brand-amber" />
                    <span>Auto-Drop Dutch Auction</span>
                  </span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-brand-amber text-white">
                    {listing.is_halted
                      ? "Halted"
                      : decorators?.autoDropBadge?.label || "-5% Weekly"}
                  </span>
                </div>
                <div className="text-xs text-amber-900/90 space-y-1">
                  {!listing.is_halted && autoDropNextPrice && (
                    <p>
                      Next scheduled price drop:{" "}
                      <strong className="tabular-nums">
                        {decorators?.auctionMeta?.formattedNextDropPrice ||
                          formatBDT(autoDropNextPrice)}
                      </strong>{" "}
                      ({listing.drop_percentage || 5}% off)
                    </p>
                  )}
                  {listing.min_reserve_price != null && (
                    <p>
                      Minimum reserve floor:{" "}
                      <strong className="tabular-nums">
                        {formatBDT(listing.min_reserve_price)}
                      </strong>
                    </p>
                  )}
                  {listing.next_drop_at && !listing.is_halted && (
                    <p className="text-[11px] text-amber-800/80">
                      Next scheduled check: {formatDateTime(listing.next_drop_at)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Buyer Primary Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {inCart ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-default shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>In Cart</span>
                  </button>
                  <Link
                    href="/cart"
                    className="py-3 px-4 rounded-xl bg-[#232F3E] hover:bg-[#131921] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4 text-brand-amber" />
                    <span>View Cart</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isAvailable
                      ? "bg-brand-amber hover:bg-brand-amberHover text-white active:scale-[0.99]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {isAvailable
                      ? `Add to Cart — ${formatBDT(askingPrice)}`
                      : `Unavailable (${listing.listing_status})`}
                  </span>
                </button>
              )}

              {cartToast && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span>Added to your shopping cart!</span>
                  <Link href="/cart" className="underline font-bold">
                    Go to Cart
                  </Link>
                </p>
              )}

              {/* Report Listing Button */}
              <button
                type="button"
                onClick={openReportModal}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-700 border border-gray-300 hover:border-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report This Listing</span>
              </button>
            </div>

            {/* Make an Offer (70%-85% Slider) Planned Workflow Callout */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <Sliders className="w-4 h-4 text-brand-teal" />
                  <span>Make an Offer (70%–85% Slider)</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#232F3E] text-amber-300">
                  Available in Final Milestone (Phase 8)
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Structured anti-lowball bargaining constrains buyer offers strictly between{" "}
                <strong className="text-gray-900 tabular-nums">
                  {formatBDT(minOffer70)} (70%)
                </strong>{" "}
                and{" "}
                <strong className="text-gray-900 tabular-nums">
                  {formatBDT(maxOffer85)} (85%)
                </strong>{" "}
                across up to 3 rounds. Accepting an offer locks the deal and unlocks seller contact info.
              </p>

              {/* Non-interactive preview track */}
              <div className="pt-1">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 mx-auto bg-gradient-to-r from-brand-teal/50 to-brand-amber/50 rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mt-1 tabular-nums">
                  <span>70% Floor: {formatBDT(minOffer70)}</span>
                  <span>85% Cap: {formatBDT(maxOffer85)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================
              PROTECTION PROXY PRIVACY SHOWCASE CARD (KEY DEMO FEATURE)
              ================================================================ */}
          <section className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-md">
            {/* Dark Header Banner */}
            <div className="bg-[#131921] text-white px-5 py-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {contactUnlocked ? (
                  <Unlock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-brand-amber flex-shrink-0" />
                )}
                <h2 className="text-sm font-bold tracking-tight">
                  Seller Profile &amp; Privacy Protection
                </h2>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  contactUnlocked
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                }`}
              >
                {contactUnlocked ? "Unlocked" : "Proxy Masked"}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Seller Identity Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#232F3E] to-brand-teal text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm">
                    {(listing.seller_name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {listing.seller_name || "Campus Student"}
                      </h3>
                      {isCampusVerified && (
                        <Badge variant="campus-verified" size="xs">
                          Campus Verified
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <StarRating
                        rating={listing.seller_rating ?? 0}
                        totalReviews={listing.seller_reviews ?? 0}
                        size="xs"
                      />
                      {listing.campus_area && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {listing.campus_area}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlighted Contact & Privacy Protection Panel */}
              {contactUnlocked ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">
                        Contact &amp; Privacy Protection — Unlocked
                      </span>
                    </div>
                    {listing.contact_mask_reason && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        <Unlock className="w-3 h-3" />
                        <span>{listing.contact_mask_reason}</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-start gap-2.5 bg-white/90 border border-emerald-200/80 rounded-lg px-3 py-2">
                      <Phone className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Seller Phone
                        </span>
                        <span className="font-bold text-gray-900 break-all">
                          {listing.seller_phone || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white/90 border border-emerald-200/80 rounded-lg px-3 py-2">
                      <Home className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Residential / Handover Address
                        </span>
                        <span className="font-bold text-gray-900 break-words">
                          {listing.seller_address || listing.campus_area || "Not provided"}
                        </span>
                      </div>
                    </div>

                    {listing.seller_email && (
                      <div className="flex items-start gap-2.5 bg-white/90 border border-emerald-200/80 rounded-lg px-3 py-2">
                        <Mail className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            Seller Email
                          </span>
                          <span className="font-bold text-gray-900 break-all">
                            {listing.seller_email}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-emerald-800/90 flex items-start gap-1.5 leading-snug">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      Direct seller contact details are visible because your session passed the server-side{" "}
                      <strong>ListingAccessProxy</strong> authorization check.
                    </span>
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-amber-900">
                      <Lock className="w-4 h-4 text-brand-amber flex-shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">
                        Contact &amp; Privacy Protection
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      Protected by Proxy
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5 bg-white/90 border border-amber-200/70 rounded-lg px-3 py-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Seller Phone
                        </span>
                        <span className="font-semibold text-gray-600 italic flex items-center gap-1">
                          <Lock className="w-3 h-3 text-brand-amber flex-shrink-0" />
                          <span>{listing.seller_phone || "Hidden until offer accepted"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-white/90 border border-amber-200/70 rounded-lg px-3 py-2">
                      <Home className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Seller Address
                        </span>
                        <span className="font-semibold text-gray-600">
                          {listing.seller_address ||
                            `${listing.campus_area || "Dhaka Campus"} (Exact address hidden until offer accepted)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#232F3E] text-gray-100 rounded-lg p-3 text-[11px] leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white mb-0.5">
                        Protection Proxy Active
                      </p>
                      <p className="text-gray-300">
                        {listing.contact_mask_reason ||
                          "Personal contact information is protected server-side by the Protection Proxy until an offer is mutually accepted (or when viewed by the listing owner or an administrator)."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ====================================================================
          REPORT LISTING MODAL
          ==================================================================== */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#131921] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-400" />
                <h2 id="report-modal-title" className="text-sm font-bold">
                  Report Listing
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white"
                aria-label="Close report modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {!user ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-brand-amber">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    Sign In Required
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Please sign in to your HaatBodol account to submit a moderation report for{" "}
                    <strong>{listing.title}</strong>.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : reportSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    Report Submitted
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {reportSuccess.message}
                  </p>
                  {reportSuccess.reportId && (
                    <p className="text-[11px] font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-md py-1 px-2 inline-block">
                      Reference ID: #{reportSuccess.reportId}
                    </p>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="px-5 py-2 rounded-lg bg-brand-teal hover:bg-brand-tealHover text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <p className="text-xs text-gray-600">
                    Flagging <strong className="text-gray-900">{listing.title}</strong> for admin review.
                  </p>

                  <div>
                    <label
                      htmlFor="report-reason"
                      className="block text-xs font-bold text-gray-800 mb-1.5"
                    >
                      Reason for Report
                    </label>
                    <select
                      id="report-reason"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="report-details"
                      className="block text-xs font-bold text-gray-800 mb-1.5"
                    >
                      Additional Details
                    </label>
                    <textarea
                      id="report-details"
                      rows={4}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Provide specific details that will help moderators review this listing..."
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                    />
                  </div>

                  {reportError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{reportError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      disabled={reportSubmitting}
                      className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reportSubmitting}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                    >
                      {reportSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          DELETE LISTING CONFIRMATION MODAL (Owner / Admin)
          ==================================================================== */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <h2 id="delete-modal-title" className="text-sm font-bold">
                  Confirm Listing Deletion
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="p-1 rounded hover:bg-white/10 text-white"
                aria-label="Close delete modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <strong className="text-gray-900">{listing.title}</strong>? This action cannot be
                undone and removes all associated photos and Auto-Drop settings.
              </p>

              {deleteError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteListing}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? "Deleting..." : "Delete Permanently"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
