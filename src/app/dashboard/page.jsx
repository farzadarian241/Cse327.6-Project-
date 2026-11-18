"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Handshake,
  ShoppingBag,
  Heart,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  Edit3,
  Trash2,
  Repeat,
  MapPin,
  Phone,
  Mail,
  Home,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Lock,
  ExternalLink,
  RefreshCw,
  X,
  ArrowRight,
  Sparkles,
  UserCheck,
  FileText,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/shared/Badge";
import StarRating from "@/components/shared/StarRating";
import ProductCard from "@/components/listings/ProductCard";

const CONDITIONS = ["Like New", "Good", "Fair", "Needs Repair"];

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "৳0";
  return `৳${num.toLocaleString()}`;
}

function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return String(isoString);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function resolveListingImage(item) {
  if (!item) return "/uploads/defaults/laptop.jpg";
  if (item.image_url) return item.image_url;
  if (item.listing_image) return item.listing_image;
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0]?.image_url || item.images[0];
  }
  const cat = (item.category || "").toLowerCase();
  if (cat.includes("elect")) return "/uploads/defaults/laptop.jpg";
  if (cat.includes("furn")) return "/uploads/defaults/study-desk.jpg";
  if (cat.includes("cloth")) return "/uploads/defaults/winter-jacket.jpg";
  return "/uploads/defaults/laptop.jpg";
}

function SessionStatusBadge({ status }) {
  const normalized = (status || "PENDING").toUpperCase();
  const styles = {
    PENDING: "bg-amber-50 text-amber-800 border-amber-200",
    COUNTERED: "bg-sky-50 text-sky-800 border-sky-200",
    ACCEPTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[normalized] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {normalized}
    </span>
  );
}

function OrderStatusPill({ label, type }) {
  const val = (label || "").toUpperCase();
  let cls = "bg-gray-100 text-gray-700 border-gray-200";
  if (val === "PAID" || val === "DELIVERED") {
    cls = "bg-emerald-50 text-emerald-800 border-emerald-200";
  } else if (val === "READY_FOR_PICKUP" || val === "PROCESSING") {
    cls = "bg-sky-50 text-sky-800 border-sky-200";
  } else if (val === "PENDING") {
    cls = "bg-amber-50 text-amber-800 border-amber-200";
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${cls}`}>
      {type && <span className="opacity-70 font-normal">{type}:</span>}
      <span>{val.replace(/_/g, " ")}</span>
    </span>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, activeRole, switchRole, loading: authLoading, isCampusVerified } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeTab, setActiveTab] = useState("listings");
  const [roleSwitching, setRoleSwitching] = useState(false);

  // Mutation & Feedback State
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: string }
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    current_asking_price: "",
    item_condition: "Good",
    pickup_location: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingListing, setDeletingListing] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev && prev.text === text ? null : prev));
    }, 4500);
  }, []);

  // Fetch GET /api/dashboard
  const loadDashboard = useCallback(async () => {
    if (!user) {
      setFetching(false);
      return;
    }
    setFetching(true);
    setFetchError("");
    try {
      const res = await fetch("/api/dashboard", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.status === 401) {
        setFetchError("Your session has expired. Please sign in again.");
        setDashboardData(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.message || data.error || "Unable to load dashboard data.");
        return;
      }
      setDashboardData(data);
    } catch (err) {
      setFetchError(err.message || "Network error while loading dashboard.");
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboard();
    } else if (!authLoading && !user) {
      setFetching(false);
    }
  }, [authLoading, user, loadDashboard]);

  // Sync ?tab= query parameter and activeRole
  useEffect(() => {
    const tabParam = (searchParams.get("tab") || "").toLowerCase();
    if (tabParam === "listings") {
      setActiveTab("listings");
    } else if (tabParam === "incoming") {
      setActiveTab("incoming");
    } else if (tabParam === "offers" || tabParam === "negotiations") {
      setActiveTab(activeRole === "SELLER" ? "incoming" : "offers");
    } else if (tabParam === "orders") {
      setActiveTab("orders");
    } else if (tabParam === "watchlist") {
      setActiveTab("watchlist");
    } else {
      setActiveTab(activeRole === "SELLER" ? "listings" : "offers");
    }
  }, [searchParams, activeRole]);

  const handleRoleToggle = async (targetRole) => {
    if (roleSwitching) return;
    const nextDefaultTab = targetRole === "SELLER" ? "listings" : "offers";
    if (targetRole === activeRole) {
      setActiveTab(nextDefaultTab);
      router.replace(`/dashboard?tab=${nextDefaultTab}`, { scroll: false });
      return;
    }
    setRoleSwitching(true);
    try {
      await switchRole(targetRole);
      setActiveTab(nextDefaultTab);
      router.replace(`/dashboard?tab=${nextDefaultTab}`, { scroll: false });
      showToast("success", `Switched to ${targetRole === "SELLER" ? "Seller" : "Buyer"} Mode.`);
    } finally {
      setRoleSwitching(false);
    }
  };

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    router.replace(`/dashboard?tab=${tabKey}`, { scroll: false });
  };

  // Quick Status Dropdown (PATCH /api/listings/{id})
  const handleStatusChange = async (listingId, newStatus) => {
    setStatusUpdatingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.message || data.error || "Failed to update listing status.");
        return;
      }
      showToast("success", `Listing #${listingId} status updated to ${newStatus}.`);
      await loadDashboard();
    } catch (err) {
      showToast("error", err.message || "Network error updating listing status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (listing) => {
    setEditingListing(listing);
    setEditForm({
      title: listing.title || "",
      description: listing.description || "",
      current_asking_price: listing.current_asking_price ?? "",
      item_condition: listing.item_condition || "Good",
      pickup_location: listing.pickup_location || "",
    });
    setEditError("");
  };

  // Save Edit Modal (PATCH /api/listings/{id})
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    const trimmedTitle = editForm.title.trim();
    const numericPrice = Number(editForm.current_asking_price);
    const trimmedLocation = editForm.pickup_location.trim();

    if (!trimmedTitle) {
      setEditError("Title is required.");
      return;
    }
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setEditError("Please enter a valid positive asking price in BDT.");
      return;
    }
    if (!trimmedLocation) {
      setEditError("Pickup location is required.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/listings/${editingListing.listing_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: editForm.description.trim(),
          current_asking_price: numericPrice,
          item_condition: editForm.item_condition,
          pickup_location: trimmedLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.message || data.error || "Failed to update listing.");
        return;
      }
      setEditingListing(null);
      showToast("success", `Updated "${trimmedTitle}" successfully.`);
      await loadDashboard();
    } catch (err) {
      setEditError(err.message || "Network error saving changes.");
    } finally {
      setEditSaving(false);
    }
  };

  // Confirm Delete Listing (DELETE /api/listings/{id})
  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${deletingListing.listing_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.message || data.error || "Failed to delete listing.");
        return;
      }
      const removedTitle = deletingListing.title;
      setDeletingListing(null);
      showToast("success", `Deleted "${removedTitle}" permanently.`);
      await loadDashboard();
    } catch (err) {
      showToast("error", err.message || "Network error deleting listing.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
        <p className="text-sm text-gray-600 font-medium">Loading your workspace...</p>
      </div>
    );
  }

  // Unauthenticated prompt
  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-10 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-[#131921] text-white px-6 py-5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#232F3E] text-brand-amber">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Sign In Required</h1>
            <p className="text-xs text-gray-300">
              Access your personal HaatBodol Buyer &amp; Seller Dashboard
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Sign in to manage your posted listings, review incoming 70%–85% offers, track completed
            campus orders, and browse your saved watchlist.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/login?redirect=/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-amber hover:bg-brand-amberHover text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm transition-colors"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile = dashboardData?.user || user;
  const stats = dashboardData?.stats || {};
  const myListings = Array.isArray(dashboardData?.myListings) ? dashboardData.myListings : [];
  const incomingOffers = Array.isArray(dashboardData?.incomingOffers) ? dashboardData.incomingOffers : [];
  const myOffers = Array.isArray(dashboardData?.myOffers) ? dashboardData.myOffers : [];
  const myOrders = Array.isArray(dashboardData?.myOrders) ? dashboardData.myOrders : [];
  const watchlist = Array.isArray(dashboardData?.watchlist) ? dashboardData.watchlist : [];

  const isAdmin = profile?.account_type === "ADMIN";
  const verifiedStatus = Boolean(profile?.is_campus_verified ?? isCampusVerified);

  const totalListingsCount = stats.totalListings ?? myListings.length;
  const activeListingsCount =
    stats.activeListings ?? myListings.filter((l) => l.listing_status === "AVAILABLE").length;
  const incomingOffersCount = stats.incomingOffersCount ?? incomingOffers.length;
  const myOffersCount = stats.myOffersCount ?? myOffers.length;
  const ordersCount = stats.ordersCount ?? myOrders.length;
  const watchlistCount = stats.watchlistCount ?? watchlist.length;

  const isSellerTab = activeTab === "listings" || activeTab === "incoming";
  const effectiveView = isSellerTab ? "SELLER" : "BUYER";

  const sellerTabs = [
    {
      key: "listings",
      label: "My Listings",
      count: myListings.length,
      icon: Package,
    },
    {
      key: "incoming",
      label: "Incoming Offers",
      count: incomingOffers.length,
      icon: Handshake,
    },
  ];

  const buyerTabs = [
    {
      key: "offers",
      label: "My Negotiations",
      count: myOffers.length,
      icon: Handshake,
    },
    {
      key: "orders",
      label: "My Orders",
      count: myOrders.length,
      icon: ShoppingBag,
    },
    {
      key: "watchlist",
      label: "Watchlist",
      count: watchlist.length,
      icon: Heart,
    },
  ];

  const visibleTabs = effectiveView === "SELLER" ? sellerTabs : buyerTabs;

  return (
    <div className="space-y-6">
      {/* =====================================================================
          ADMIN BANNER (Visible only when user.account_type === "ADMIN")
          ===================================================================== */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-[#131921] via-[#232F3E] to-[#131921] border border-purple-500/40 rounded-xl p-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-600/30 border border-purple-400/40 shrink-0">
              <ShieldAlert className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  Administrator Privileges Active
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-1">
                Review flagged listings, manage user accounts, and monitor Auto-Drop schedules.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-xs sm:text-sm font-bold transition-colors shadow-sm shrink-0"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Open Admin Moderation Panel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* =====================================================================
          UNIFIED DASHBOARD HEADER + ROLE TOGGLE
          ===================================================================== */}
      <div className="bg-[#131921] text-white rounded-xl p-5 sm:p-6 shadow-md border border-[#232F3E]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <LayoutDashboard className="w-5 h-5 text-brand-amber" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {profile.full_name}&apos;s Dashboard
              </h1>
              {verifiedStatus && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-200 bg-teal-900/60 border border-teal-500/40 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Campus Verified</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-300">
              {activeRole === "SELLER"
                ? "Seller Mode — Manage your inventory, pricing, listing visibility, and incoming offers."
                : "Buyer Mode — Track your active negotiations, campus orders, and saved watchlist deals."}
            </p>
          </div>

          {/* Prominent Role Switcher matching AuthContext.switchRole() */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex items-center bg-[#232F3E] p-1 rounded-lg border border-[#37475A]"
              role="group"
              aria-label="Switch dashboard role"
            >
              <button
                type="button"
                disabled={roleSwitching}
                onClick={() => handleRoleToggle("BUYER")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeRole === "BUYER"
                    ? "bg-brand-teal text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Buyer View</span>
              </button>
              <button
                type="button"
                disabled={roleSwitching}
                onClick={() => handleRoleToggle("SELLER")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeRole === "SELLER"
                    ? "bg-brand-amber text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Seller View</span>
              </button>
            </div>

            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-xs font-bold transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Post New Item</span>
            </Link>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={fetching}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#232F3E] hover:bg-[#2a3749] border border-[#37475A] text-gray-200 text-xs font-semibold transition-colors"
              title="Refresh dashboard data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="status"
          className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-sm shadow-sm ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-teal-50 border-teal-200 text-teal-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
            )}
            <span className="font-medium">{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded hover:bg-black/5"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold self-start sm:self-auto"
          >
            Try Again
          </button>
        </div>
      )}

      {/* =====================================================================
          KPI SUMMARY ROW
          ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide">My Listings</span>
            <Package className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-2xl font-black text-gray-900 tabular-nums">{totalListingsCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {stats.soldListings ?? myListings.filter((l) => l.listing_status === "SOLD").length} sold total
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide">Active Listings</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 tabular-nums">{activeListingsCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Live on marketplace</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide">Offers</span>
            <Handshake className="w-4 h-4 text-brand-teal" />
          </div>
          <p className="text-2xl font-black text-gray-900 tabular-nums">
            {activeRole === "SELLER" ? incomingOffersCount : myOffersCount}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {incomingOffersCount} incoming &middot; {myOffersCount} sent
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide">Orders</span>
            <ShoppingBag className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 tabular-nums">{ordersCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{watchlistCount} saved in watchlist</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide">Seller Rating</span>
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
          </div>
          <div className="mt-1">
            <StarRating
              rating={profile.average_rating ?? 0}
              totalReviews={profile.total_reviews ?? 0}
              size="md"
              showScore={true}
              showCount={true}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">
            {verifiedStatus ? "Campus Verified Profile" : "Standard Community Profile"}
          </p>
        </div>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE GRID (Tabs Content + Account & Campus Verification Card)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View & Tab Navigation Strip */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#232F3E] text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Repeat className="w-3.5 h-3.5 text-brand-amber" />
                <span>
                  {effectiveView === "SELLER" ? "Seller Operations" : "Buyer Activity"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {effectiveView === "SELLER" ? (
                  <button
                    type="button"
                    onClick={() => handleTabSelect("watchlist")}
                    className="text-teal-300 hover:text-teal-200 font-semibold underline-offset-2 hover:underline"
                  >
                    Jump to Watchlist ({watchlistCount})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTabSelect("listings")}
                    className="text-amber-300 hover:text-amber-200 font-semibold underline-offset-2 hover:underline"
                  >
                    Jump to My Listings ({totalListingsCount})
                  </button>
                )}
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center border-b border-gray-200 bg-gray-50 px-2 pt-2 overflow-x-auto">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabSelect(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                      isSelected
                        ? "border-brand-amber text-[#131921] bg-white rounded-t-lg"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-t-lg"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-brand-amber" : "text-gray-400"
                      }`}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        isSelected
                          ? "bg-amber-100 text-amber-900"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}

              {/* Quick Cross-View Tab Pill so both Buyer & Seller tabs are one click away */}
              <div className="ml-auto hidden sm:flex items-center gap-1 pr-2 pb-1">
                {effectiveView === "SELLER" ? (
                  <button
                    type="button"
                    onClick={() => handleRoleToggle("BUYER")}
                    className="text-[11px] font-semibold text-brand-teal hover:bg-teal-50 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Switch to Buyer Tabs &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRoleToggle("SELLER")}
                    className="text-[11px] font-semibold text-brand-amber hover:bg-amber-50 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Switch to Seller Tabs &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-5">
              {fetching && !dashboardData ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="w-7 h-7 animate-spin text-brand-teal" />
                  <p className="text-xs text-gray-500 font-medium">
                    Fetching live data from MySQL...
                  </p>
                </div>
              ) : (
                <>
                  {/* ---------------------------------------------------------
                      SELLER TAB 1: MY LISTINGS
                      --------------------------------------------------------- */}
                  {activeTab === "listings" && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <h2 className="text-base font-bold text-gray-900">
                            My Inventory Listings ({myListings.length})
                          </h2>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                            <span>
                              All edits, status changes, and deletions are enforced server-side by{" "}
                              <strong className="text-gray-700">ListingAccessProxy</strong>.
                            </span>
                          </p>
                        </div>
                        <Link
                          href="/listings/new"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-amber hover:bg-brand-amberHover text-white font-bold text-xs rounded-lg transition-colors shadow-sm shrink-0"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>+ Post New Item</span>
                        </Link>
                      </div>

                      {myListings.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-sm font-bold text-gray-800">No Listings Posted Yet</h3>
                          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            Turn your unused electronics, dorm furniture, or winter gear into cash
                            with fair depreciation pricing.
                          </p>
                          <Link
                            href="/listings/new"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-amber hover:bg-brand-amberHover text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>+ Post New Item</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myListings.map((item) => {
                            const status = item.listing_status || "AVAILABLE";
                            const imgUrl = resolveListingImage(item);
                            const isUpdating = statusUpdatingId === item.listing_id;

                            return (
                              <div
                                key={item.listing_id}
                                className="flex flex-col sm:flex-row gap-4 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-all"
                              >
                                {/* Thumbnail */}
                                <Link
                                  href={`/listings/${item.listing_id}`}
                                  className="w-full sm:w-28 h-28 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center p-2"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                </Link>

                                {/* Info & Controls */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <Link
                                        href={`/listings/${item.listing_id}`}
                                        className="text-sm font-bold text-gray-900 hover:text-brand-teal transition-colors line-clamp-1"
                                      >
                                        {item.title}
                                      </Link>
                                      <Badge size="xs">{status}</Badge>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                      <span className="text-base font-black text-gray-900 tabular-nums">
                                        {formatCurrency(item.current_asking_price)}
                                      </span>
                                      {Number(item.original_price) > Number(item.current_asking_price) && (
                                        <span className="text-xs text-gray-400 line-through tabular-nums">
                                          {formatCurrency(item.original_price)}
                                        </span>
                                      )}
                                      <Badge size="xs">{item.item_condition || "Good"}</Badge>
                                      {item.auto_drop_enabled && (
                                        <Badge variant="autodrop" size="xs">
                                          Auto-Drop
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center flex-wrap gap-3 text-[11px] text-gray-500 mt-1.5">
                                      <span className="inline-flex items-center gap-1 truncate max-w-[260px]">
                                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span className="truncate">{item.pickup_location}</span>
                                      </span>
                                      <span>Listed {formatDate(item.published_at)}</span>
                                    </div>
                                  </div>

                                  {/* Quick Status Dropdown + Edit & Delete Actions */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <label
                                        htmlFor={`status-${item.listing_id}`}
                                        className="text-[11px] font-semibold text-gray-600"
                                      >
                                        Status:
                                      </label>
                                      <select
                                        id={`status-${item.listing_id}`}
                                        value={status}
                                        disabled={isUpdating}
                                        onChange={(e) =>
                                          handleStatusChange(item.listing_id, e.target.value)
                                        }
                                        className="text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-amber disabled:opacity-50"
                                      >
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="HIDDEN">HIDDEN</option>
                                        <option value="SOLD">SOLD</option>
                                        {status === "RESERVED" && (
                                          <option value="RESERVED">RESERVED</option>
                                        )}
                                      </select>
                                      {isUpdating && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-teal" />
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <Link
                                        href={`/listings/${item.listing_id}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>View</span>
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-brand-teal bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeletingListing(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------------------------------------------------
                      SELLER TAB 2: INCOMING OFFERS
                      --------------------------------------------------------- */}
                  {activeTab === "incoming" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <Info className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Structured 3-Round Bargaining Preview:</span>{" "}
                          Incoming offers below are loaded live from the database. Interactive
                          Counter-Offer, Accept, and Reject deal-lock actions unlock in{" "}
                          <strong className="font-bold">Phase 8 (Final Milestone)</strong>.
                        </div>
                      </div>

                      {incomingOffers.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Handshake className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-sm font-bold text-gray-800">No Incoming Offers Yet</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            When campus buyers submit 70%–85% offers on your listings, they will appear
                            here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {incomingOffers.map((offer) => {
                            const listingId = offer.listing_id;
                            const listingTitle =
                              offer.listing_title || offer.title || `Listing #${listingId}`;
                            const buyerName =
                              offer.buyer_name || offer.buyer_full_name || "Campus Buyer";
                            const offerAmt =
                              offer.current_offer_amount ?? offer.offer_amount ?? 0;
                            const askingPrice =
                              offer.asking_price ?? offer.current_asking_price;

                            return (
                              <div
                                key={offer.session_id}
                                className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                      href={`/listings/${listingId}`}
                                      className="text-sm font-bold text-gray-900 hover:text-brand-teal transition-colors"
                                    >
                                      {listingTitle}
                                    </Link>
                                    <SessionStatusBadge status={offer.session_status} />
                                  </div>
                                  <div className="flex items-center flex-wrap gap-3 text-xs text-gray-600">
                                    <span>
                                      Buyer:{" "}
                                      <strong className="text-gray-800">{buyerName}</strong>
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[11px]">
                                      Round {offer.round_count ?? 1} / 3
                                    </span>
                                    {offer.updated_at && (
                                      <span className="text-gray-400">
                                        Updated {formatDate(offer.updated_at)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                                  <span className="text-xs text-gray-500 font-medium">
                                    Current Offer
                                  </span>
                                  <span className="text-lg font-black text-brand-teal tabular-nums">
                                    {formatCurrency(offerAmt)}
                                  </span>
                                  {askingPrice != null && (
                                    <span className="text-[11px] text-gray-400">
                                      Asking: {formatCurrency(askingPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------------------------------------------------
                      BUYER TAB 1: MY NEGOTIATIONS
                      --------------------------------------------------------- */}
                  {activeTab === "offers" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900">
                        <Info className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">70%–85% Anti-Lowball Negotiations:</span> Your
                          active bargaining sessions are listed below. Live counter-offer responses
                          and direct contact unlock chat arrive in{" "}
                          <strong className="font-bold">Phase 8 (Final Milestone)</strong>.
                        </div>
                      </div>

                      {myOffers.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Handshake className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-sm font-bold text-gray-800">
                            No Active Negotiations
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Browse pre-owned campus listings to start a structured 3-round offer.
                          </p>
                          <Link
                            href="/listings"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-teal hover:bg-brand-tealHover text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <span>Explore Marketplace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myOffers.map((offer) => {
                            const listingId = offer.listing_id;
                            const listingTitle =
                              offer.listing_title || offer.title || `Listing #${listingId}`;
                            const sellerName =
                              offer.seller_name || offer.seller_full_name || "Campus Seller";
                            const offerAmt =
                              offer.current_offer_amount ?? offer.offer_amount ?? 0;
                            const askingPrice =
                              offer.asking_price ?? offer.current_asking_price;

                            return (
                              <div
                                key={offer.session_id}
                                className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                      href={`/listings/${listingId}`}
                                      className="text-sm font-bold text-gray-900 hover:text-brand-teal transition-colors"
                                    >
                                      {listingTitle}
                                    </Link>
                                    <SessionStatusBadge status={offer.session_status} />
                                  </div>
                                  <div className="flex items-center flex-wrap gap-3 text-xs text-gray-600">
                                    <span>
                                      Seller:{" "}
                                      <strong className="text-gray-800">{sellerName}</strong>
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[11px]">
                                      Round {offer.round_count ?? 1} / 3
                                    </span>
                                    {offer.updated_at && (
                                      <span className="text-gray-400">
                                        Updated {formatDate(offer.updated_at)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                                  <span className="text-xs text-gray-500 font-medium">
                                    Current Offer
                                  </span>
                                  <span className="text-lg font-black text-brand-amber tabular-nums">
                                    {formatCurrency(offerAmt)}
                                  </span>
                                  {askingPrice != null && (
                                    <span className="text-[11px] text-gray-400">
                                      Asking: {formatCurrency(askingPrice)}
                                    </span>
                                  )}
                                  <Link
                                    href={`/listings/${listingId}`}
                                    className="text-[11px] font-semibold text-brand-teal hover:underline inline-flex items-center gap-0.5"
                                  >
                                    <span>View Item</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------------------------------------------------
                      BUYER TAB 2: MY ORDERS
                      --------------------------------------------------------- */}
                  {activeTab === "orders" && (
                    <div className="space-y-4">
                      {myOrders.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-sm font-bold text-gray-800">No Orders Found</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Completed campus meetups and courier orders will appear here with invoice
                            details.
                          </p>
                          <Link
                            href="/listings"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-amber hover:bg-brand-amberHover text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <span>Browse Available Items</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myOrders.map((order) => {
                            const listingTitle =
                              order.listing_title || order.title || `Listing #${order.listing_id}`;
                            const isBuyer = Number(order.buyer_id) === Number(profile.user_id);
                            const counterparty = isBuyer
                              ? order.seller_name || "Seller"
                              : order.buyer_name || "Buyer";

                            return (
                              <div
                                key={order.order_id}
                                className="p-4 rounded-lg border border-gray-200 bg-white space-y-2.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-[#131921] text-white px-2 py-0.5 rounded">
                                      <FileText className="w-3 h-3 text-brand-amber" />
                                      {order.invoice_number}
                                    </span>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                      {isBuyer ? "Purchased" : "Sold"}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatDate(order.completed_at)}
                                    </span>
                                  </div>
                                  <span className="text-base font-black text-gray-900 tabular-nums">
                                    {formatCurrency(order.final_agreed_price)}
                                  </span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="space-y-1">
                                    <Link
                                      href={`/listings/${order.listing_id}`}
                                      className="text-sm font-bold text-gray-900 hover:text-brand-teal transition-colors"
                                    >
                                      {listingTitle}
                                    </Link>
                                    <p className="text-xs text-gray-600">
                                      {isBuyer ? "Seller" : "Buyer"}:{" "}
                                      <strong className="text-gray-800">{counterparty}</strong>
                                      {order.shipping_address ? (
                                        <span className="text-gray-400">
                                          {" "}
                                          &middot; {order.shipping_address}
                                        </span>
                                      ) : null}
                                    </p>
                                  </div>

                                  <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                                    <OrderStatusPill
                                      type="Payment"
                                      label={order.payment_status || "PENDING"}
                                    />
                                    <OrderStatusPill
                                      type="Delivery"
                                      label={order.delivery_status || "PROCESSING"}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------------------------------------------------
                      BUYER TAB 3: WATCHLIST
                      --------------------------------------------------------- */}
                  {activeTab === "watchlist" && (
                    <div className="space-y-4">
                      {watchlist.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Heart className="w-10 h-10 text-rose-300 mx-auto mb-2" />
                          <h3 className="text-sm font-bold text-gray-800">
                            Your Watchlist Is Empty
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Bookmark items you like to monitor Auto-Drop price reductions and campus
                            availability.
                          </p>
                          <Link
                            href="/listings"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-teal hover:bg-brand-tealHover text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <span>Browse Listings</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {watchlist.map((item) => (
                            <ProductCard
                              key={item.listing_id || item.watchlist_id}
                              listing={item}
                              isWatchlisted={true}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN (4 cols): ACCOUNT & CAMPUS VERIFICATION CARD
            =================================================================== */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#232F3E] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-amber" />
                <h2 className="text-sm font-bold">Account &amp; Campus Verification</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-gray-200">
                {profile.account_type || "USER"}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Identity + Rating */}
              <div className="pb-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">{profile.full_name}</h3>
                <div className="mt-1.5 flex items-center flex-wrap gap-2">
                  {verifiedStatus ? (
                    <Badge variant="campus-verified" size="sm">
                      Campus Verified Student
                    </Badge>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      Standard Community Account
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <StarRating
                    rating={profile.average_rating ?? 0}
                    totalReviews={profile.total_reviews ?? 0}
                    size="sm"
                    showScore={true}
                    showCount={true}
                  />
                </div>
              </div>

              {/* Contact & Campus Details */}
              <dl className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      Email Address
                    </dt>
                    <dd className="text-gray-900 font-medium break-all">{profile.email || "—"}</dd>
                    {profile.institutional_email &&
                      profile.institutional_email !== profile.email && (
                        <dd className="text-[11px] text-brand-teal font-medium mt-0.5">
                          Institutional: {profile.institutional_email}
                        </dd>
                      )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      Phone Number
                    </dt>
                    <dd className="text-gray-900 font-medium">
                      {profile.phone_number || "Not provided"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Home className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      Residential Address
                    </dt>
                    <dd className="text-gray-900 font-medium">
                      {profile.residential_address || "Not provided"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      Campus Area
                    </dt>
                    <dd className="text-gray-900 font-semibold">
                      {profile.campus_area || "Dhaka Central"}
                    </dd>
                  </div>
                </div>
              </dl>

              {/* Privacy Note */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-brand-teal shrink-0 mt-0.5" />
                <span>
                  Your phone and exact address stay masked on public listings via{" "}
                  <strong className="text-gray-800">ListingAccessProxy</strong> until an offer is
                  accepted.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Quick Actions
            </h3>
            <Link
              href="/listings"
              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-800 transition-colors"
            >
              <span>Browse Marketplace Deals</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
            <Link
              href="/listings?autodrop=true"
              className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100/70 text-xs font-semibold text-amber-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-amber" />
                <span>View Auto-Drop Clearance</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-amber" />
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-900 border border-purple-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                  <span>Open Admin Moderation Panel</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-700" />
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* =====================================================================
          EDIT LISTING MODAL (PATCH /api/listings/{id})
          ===================================================================== */}
      {editingListing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-listing-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#131921] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-amber" />
                <h2 id="edit-listing-title" className="text-sm font-bold">
                  Edit Listing #{editingListing.listing_id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Listing Title
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Asking Price (BDT ৳)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={editForm.current_asking_price}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, current_asking_price: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Item Condition
                  </label>
                  <select
                    value={editForm.item_condition}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, item_condition: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  required
                  value={editForm.pickup_location}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, pickup_location: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  disabled={editSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-teal hover:bg-brand-tealHover transition-colors disabled:opacity-60"
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          DELETE CONFIRMATION MODAL (DELETE /api/listings/{id})
          ===================================================================== */}
      {deletingListing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-listing-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <h2 id="delete-listing-title" className="text-sm font-bold">
                  Confirm Listing Deletion
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDeletingListing(null)}
                className="p-1 text-rose-100 hover:text-white rounded"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to permanently delete{" "}
                <strong className="text-gray-900">&ldquo;{deletingListing.title}&rdquo;</strong>?
              </p>
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                This action is authorized through <strong>ListingAccessProxy</strong> and cannot be
                undone. Any associated images and Auto-Drop schedules will also be removed.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingListing(null)}
                  disabled={deleteSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-60"
                >
                  {deleteSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[420px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
          <p className="text-sm text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
