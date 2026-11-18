"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Package,
  Flag,
  ShoppingBag,
  Clock,
  Lock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  Ban,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  Info,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/shared/Badge";
import StarRating from "@/components/shared/StarRating";

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "৳0";
  return `৳${num.toLocaleString()}`;
}

function formatDateTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return String(isoString);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPastTimestamp(isoString) {
  if (!isoString) return false;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() <= Date.now();
}

function ReportStatusBadge({ status }) {
  const s = (status || "OPEN").toUpperCase();
  if (s === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <Flag className="w-3 h-3" />
        <span>OPEN</span>
      </span>
    );
  }
  if (s === "ACTION_TAKEN") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-brand-teal border border-teal-200">
        <CheckCircle2 className="w-3 h-3" />
        <span>ACTION TAKEN</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      <XCircle className="w-3 h-3" />
      <span>DISMISSED</span>
    </span>
  );
}

function AccountStatusBadge({ status }) {
  const s = (status || "ACTIVE").toUpperCase();
  if (s === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>ACTIVE</span>
      </span>
    );
  }
  if (s === "SUSPENDED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>SUSPENDED</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
      <span>BANNED</span>
    </span>
  );
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("reports");
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [serverForbidden, setServerForbidden] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Filters
  const [reportFilter, setReportFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [userTypeFilter, setUserTypeFilter] = useState("ALL");

  // Action states
  const [toast, setToast] = useState(null);
  const [processingReportId, setProcessingReportId] = useState(null);
  const [confirmRemoveReport, setConfirmRemoveReport] = useState(null);
  const [processingUserId, setProcessingUserId] = useState(null);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev && prev.text === text ? null : prev));
    }, 5000);
  }, []);

  const isAdmin = user?.account_type === "ADMIN";

  const loadAdminData = useCallback(async () => {
    if (!user || user.account_type !== "ADMIN") {
      setFetching(false);
      return;
    }

    setFetching(true);
    setFetchError("");
    setServerForbidden(false);

    try {
      const [overviewRes, usersRes, reportsRes] = await Promise.all([
        fetch("/api/admin/overview", { headers: { "Cache-Control": "no-cache" } }),
        fetch("/api/admin/users", { headers: { "Cache-Control": "no-cache" } }),
        fetch("/api/admin/reports", { headers: { "Cache-Control": "no-cache" } }),
      ]);

      if (overviewRes.status === 403 || usersRes.status === 403 || reportsRes.status === 403) {
        setServerForbidden(true);
        return;
      }

      if (overviewRes.status === 401 || usersRes.status === 401 || reportsRes.status === 401) {
        setFetchError("Admin session expired. Please sign in again.");
        return;
      }

      const [overviewData, usersData, reportsData] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        reportsRes.json(),
      ]);

      if (!overviewRes.ok || !usersRes.ok || !reportsRes.ok) {
        setFetchError(
          overviewData.message ||
            usersData.message ||
            reportsData.message ||
            "Failed to load one or more admin datasets."
        );
        return;
      }

      setOverview(overviewData);
      setUsersList(Array.isArray(usersData.users) ? usersData.users : []);
      setReports(Array.isArray(reportsData.reports) ? reportsData.reports : []);
    } catch (err) {
      setFetchError(err.message || "Network error while loading admin data.");
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        loadAdminData();
      } else {
        setFetching(false);
      }
    }
  }, [authLoading, isAdmin, loadAdminData]);

  // Report Moderation Action (DISMISS or REMOVE_LISTING)
  const handleReportAction = async (report, action) => {
    setProcessingReportId(report.report_id);
    try {
      const res = await fetch(`/api/admin/reports/${report.report_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.message || data.error || "Moderation action failed.");
        return;
      }
      setConfirmRemoveReport(null);
      showToast(
        "success",
        data.message ||
          (action === "REMOVE_LISTING"
            ? `Report #${report.report_id} resolved and listing removed via ListingAccessProxy.`
            : `Report #${report.report_id} dismissed successfully.`)
      );
      await loadAdminData();
    } catch (err) {
      showToast("error", err.message || "Network error executing moderation action.");
    } finally {
      setProcessingReportId(null);
    }
  };

  // User Status Action (ACTIVE | SUSPENDED | BANNED)
  const handleUserStatusChange = async (targetUser, nextStatus) => {
    if (Number(targetUser.user_id) === Number(user?.user_id)) return;
    setProcessingUserId(targetUser.user_id);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.user_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.message || data.error || "Unable to update user account status.");
        return;
      }
      showToast(
        "success",
        data.message || `Updated ${targetUser.full_name}'s status to ${nextStatus}.`
      );
      await loadAdminData();
    } catch (err) {
      showToast("error", err.message || "Network error updating user status.");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (reportFilter === "ALL") return reports;
    return reports.filter((r) => (r.report_status || "OPEN").toUpperCase() === reportFilter);
  }, [reports, reportFilter]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return usersList.filter((u) => {
      const matchesQuery =
        !q ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.campus_area || "").toLowerCase().includes(q);
      const matchesStatus =
        userStatusFilter === "ALL" ||
        (u.account_status || "ACTIVE").toUpperCase() === userStatusFilter;
      const matchesType =
        userTypeFilter === "ALL" ||
        (u.account_type || "USER").toUpperCase() === userTypeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [usersList, userSearch, userStatusFilter, userTypeFilter]);

  // -------------------------------------------------------------------------
  // GUARD 1: AUTH LOADING
  // -------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
        <p className="text-sm text-gray-600 font-medium">Verifying administrator credentials...</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // GUARD 2: UNAUTHENTICATED
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-10 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-[#131921] text-white px-6 py-5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-300">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Administrator Sign In Required</h1>
            <p className="text-xs text-gray-300">
              HaatBodol Platform Moderation &amp; Governance Console
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            You must sign in with an administrator account to access flagged listing moderation,
            user account governance, and Auto-Drop schedule monitoring.
          </p>
          <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-700" />
              <span>Evaluator Admin Demo Account</span>
            </p>
            <p>
              Email: <code className="font-mono font-bold">admin@haatbodol.com</code> &middot;
              Password: <code className="font-mono font-bold">Password123!</code>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/login?redirect=/admin"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-amber hover:bg-brand-amberHover text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
            >
              <span>Sign In as Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm transition-colors"
            >
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // GUARD 3: 403 ACCESS DENIED (AUTHENTICATED NON-ADMIN)
  // -------------------------------------------------------------------------
  if (!isAdmin || serverForbidden) {
    return (
      <div className="max-w-lg mx-auto my-10 bg-white rounded-xl shadow-md border border-rose-200 overflow-hidden">
        <div className="bg-rose-700 text-white px-6 py-5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-800/80 text-white">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
              HTTP 403 Forbidden
            </span>
            <h1 className="text-lg font-bold mt-1">Access Denied — Administrators Only</h1>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Your account (<strong>{user.email}</strong>) has standard{" "}
            <code className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-xs">
              {user.account_type || "USER"}
            </code>{" "}
            privileges. The Admin Moderation Console and all <code className="font-mono text-xs">/api/admin/*</code>{" "}
            endpoints are strictly protected by server-side RBAC.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-teal hover:bg-brand-tealHover text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to User Dashboard</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm transition-colors"
            >
              <span>Marketplace Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ADMIN CONSOLE DATA EXTRACTION
  // -------------------------------------------------------------------------
  const kpis = overview?.kpis || {};
  const autoDropConfigs = Array.isArray(overview?.autoDropConfigs)
    ? overview.autoDropConfigs
    : Array.isArray(overview?.auto_drop_configs)
    ? overview.auto_drop_configs
    : [];

  const openReportsCount =
    kpis.openReports ?? reports.filter((r) => (r.report_status || "").toUpperCase() === "OPEN").length;

  const tabs = [
    {
      key: "reports",
      label: "Flagged Listings Queue",
      icon: Flag,
      badge: openReportsCount,
      badgeTone: openReportsCount > 0 ? "bg-rose-100 text-rose-800" : "bg-gray-200 text-gray-700",
    },
    {
      key: "users",
      label: "User Management",
      icon: Users,
      badge: usersList.length,
      badgeTone: "bg-gray-200 text-gray-700",
    },
    {
      key: "autodrop",
      label: "Auto-Drop Schedule Overview",
      icon: Clock,
      badge: autoDropConfigs.length,
      badgeTone: "bg-amber-100 text-amber-900",
    },
  ];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          ADMIN HEADER BANNER
          ===================================================================== */}
      <div className="bg-[#131921] text-white rounded-xl p-5 sm:p-6 shadow-md border border-[#232F3E]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-lg bg-purple-600/30 border border-purple-400/40">
                <ShieldAlert className="w-5 h-5 text-purple-300" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Admin Moderation Dashboard
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40">
                RBAC Protected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300">
              Signed in as <strong className="text-white">{user.full_name}</strong> ({user.email})
              &middot; Platform moderation, account governance &amp; Auto-Drop visibility.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#232F3E] hover:bg-[#2a3749] border border-[#37475A] text-gray-200 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>User Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={loadAdminData}
              disabled={fetching}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
              <span>Refresh Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback Banner */}
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
            aria-label="Dismiss notification"
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
            onClick={loadAdminData}
            className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold self-start sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================================
          PLATFORM KPI CARDS (6 Metrics)
          ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide">Total Users</span>
            <Users className="w-4 h-4 text-[#232F3E]" />
          </div>
          <p className="text-2xl font-black text-gray-900 tabular-nums">
            {kpis.totalUsers ?? usersList.length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Registered accounts</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide">Campus Verified</span>
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
          </div>
          <p className="text-2xl font-black text-brand-teal tabular-nums">
            {kpis.verifiedStudents ?? 0}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">.edu / .ac.bd students</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide">Active / Total</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 tabular-nums">
            <span className="text-emerald-700">{kpis.activeListings ?? 0}</span>
            <span className="text-sm font-semibold text-gray-400">
              {" "}
              / {kpis.totalListings ?? 0}
            </span>
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Marketplace listings</p>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-sm ${
            openReportsCount > 0
              ? "bg-rose-50/70 border-rose-200"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between text-gray-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide">Open Reports</span>
            <Flag
              className={`w-4 h-4 ${
                openReportsCount > 0 ? "text-rose-600" : "text-gray-400"
              }`}
            />
          </div>
          <p
            className={`text-2xl font-black tabular-nums ${
              openReportsCount > 0 ? "text-rose-700" : "text-gray-900"
            }`}
          >
            {openReportsCount}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Awaiting review</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide">Orders</span>
            <ShoppingBag className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 tabular-nums">
            {kpis.completedOrders ?? 0}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Completed orders</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide">Auto-Drop</span>
            <Sparkles className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-2xl font-black text-brand-amber tabular-nums">
            {kpis.autoDropActiveCount ?? autoDropConfigs.filter((c) => !c.is_halted).length}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Active schedules</p>
        </div>
      </div>

      {/* =====================================================================
          ADMIN TABS CONTAINER
          ===================================================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tab Strip */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-3 pt-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                  selected
                    ? "border-brand-amber text-[#131921] bg-white rounded-t-lg"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-t-lg"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${selected ? "text-brand-amber" : "text-gray-400"}`}
                />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${tab.badgeTone}`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {fetching && !overview ? (
            <div className="py-14 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-brand-teal" />
              <p className="text-xs text-gray-500 font-medium">
                Loading platform moderation data...
              </p>
            </div>
          ) : (
            <>
              {/* =============================================================
                  TAB 1: FLAGGED LISTINGS QUEUE
                  ============================================================= */}
              {activeTab === "reports" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        Moderation Reports Queue
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Removing a flagged listing delegates deletion through{" "}
                        <strong className="text-gray-700">ListingAccessProxy</strong> with full
                        admin authorization.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["ALL", "OPEN", "ACTION_TAKEN", "DISMISSED"].map((statusKey) => (
                        <button
                          key={statusKey}
                          type="button"
                          onClick={() => setReportFilter(statusKey)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            reportFilter === statusKey
                              ? "bg-[#131921] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {statusKey === "ALL" ? "All" : statusKey.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredReports.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-gray-800">
                        No Moderation Reports Match This Filter
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        The campus marketplace queue is clear.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredReports.map((report) => {
                        const isOpen = (report.report_status || "OPEN").toUpperCase() === "OPEN";
                        const isBusy = processingReportId === report.report_id;
                        const listingTitle =
                          report.listing_title ||
                          report.title ||
                          `Listing #${report.listing_id}`;
                        const sellerName =
                          report.seller_name || report.seller_full_name || "Unknown Seller";
                        const reporterName =
                          report.reporter_name || report.reporter_full_name || "Community Member";

                        return (
                          <div
                            key={report.report_id}
                            className={`p-4 rounded-xl border transition-all ${
                              isOpen
                                ? "bg-white border-rose-200 shadow-sm"
                                : "bg-gray-50/70 border-gray-200"
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="space-y-2 min-w-0 flex-1">
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#232F3E] text-white">
                                    Report #{report.report_id}
                                  </span>
                                  <ReportStatusBadge status={report.report_status} />
                                  {report.listing_status && (
                                    <Badge size="xs">{report.listing_status}</Badge>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    Reported {formatDateTime(report.created_at)}
                                  </span>
                                </div>

                                <div>
                                  <Link
                                    href={`/listings/${report.listing_id}`}
                                    className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-gray-900 hover:text-brand-teal transition-colors"
                                  >
                                    <span>{listingTitle}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  </Link>
                                  {report.current_asking_price != null && (
                                    <span className="ml-2 text-xs font-bold text-gray-700 tabular-nums">
                                      ({formatCurrency(report.current_asking_price)})
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                                  <div>
                                    Seller:{" "}
                                    <strong className="text-gray-900">{sellerName}</strong>
                                  </div>
                                  <div>
                                    Reporter:{" "}
                                    <strong className="text-gray-900">{reporterName}</strong>
                                  </div>
                                </div>

                                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                                  <p className="font-bold text-gray-900">
                                    Reason: {report.reason}
                                  </p>
                                  {report.details && (
                                    <p className="text-gray-700 leading-relaxed">
                                      {report.details}
                                    </p>
                                  )}
                                </div>

                                {report.resolved_at && (
                                  <p className="text-[11px] text-gray-500">
                                    Resolved on {formatDateTime(report.resolved_at)}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons for OPEN Reports */}
                              <div className="flex sm:flex-row lg:flex-col items-stretch gap-2 shrink-0 lg:w-48">
                                {isOpen ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleReportAction(report, "DISMISS")}
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors disabled:opacity-50"
                                    >
                                      {isBusy ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5" />
                                      )}
                                      <span>Dismiss Report</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => setConfirmRemoveReport(report)}
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Remove Listing</span>
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-xs text-gray-500 font-medium lg:text-right py-1">
                                    Moderation closed
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================
                  TAB 2: USER MANAGEMENT
                  ============================================================= */}
              {activeTab === "users" && (
                <div className="space-y-4">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name, email, or campus area..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        aria-label="Filter by account status"
                        className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="BANNED">Banned</option>
                      </select>

                      <select
                        value={userTypeFilter}
                        onChange={(e) => setUserTypeFilter(e.target.value)}
                        aria-label="Filter by account type"
                        className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
                      >
                        <option value="ALL">All Account Types</option>
                        <option value="USER">Standard Users</option>
                        <option value="ADMIN">Administrators</option>
                      </select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                      <thead className="bg-[#232F3E] text-white text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-bold">User</th>
                          <th className="px-4 py-3 font-bold">Verification</th>
                          <th className="px-4 py-3 font-bold">Role / Type</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                          <th className="px-4 py-3 font-bold">Rating</th>
                          <th className="px-4 py-3 font-bold text-right">Governance Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white text-xs">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                              No user accounts match your search filters.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => {
                            const isSelf = Number(u.user_id) === Number(user.user_id);
                            const status = (u.account_status || "ACTIVE").toUpperCase();
                            const isBusy = processingUserId === u.user_id;
                            const verified = Boolean(u.is_campus_verified);

                            return (
                              <tr
                                key={u.user_id}
                                className={`hover:bg-gray-50/80 transition-colors ${
                                  isSelf ? "bg-purple-50/40" : ""
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                    <span>{u.full_name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-gray-500">{u.email}</div>
                                  <div className="text-[11px] text-gray-400">
                                    {u.campus_area || "Dhaka Central"}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  {verified ? (
                                    <Badge variant="campus-verified" size="xs">
                                      Campus Verified
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] text-gray-500 font-medium">
                                      Standard
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex flex-col items-start gap-1">
                                    <span
                                      className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                                        u.account_type === "ADMIN"
                                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {u.account_type || "USER"}
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                      Mode: <strong>{u.active_role || "BUYER"}</strong>
                                    </span>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <AccountStatusBadge status={status} />
                                </td>

                                <td className="px-4 py-3">
                                  <StarRating
                                    rating={u.average_rating ?? 0}
                                    totalReviews={u.total_reviews ?? 0}
                                    size="xs"
                                    showScore={true}
                                    showCount={true}
                                  />
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {isSelf ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-semibold italic">
                                      <Lock className="w-3 h-3" />
                                      <span>Current Admin Protected</span>
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                                      {status !== "ACTIVE" && (
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleUserStatusChange(u, "ACTIVE")}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors disabled:opacity-50"
                                        >
                                          <PlayCircle className="w-3 h-3" />
                                          <span>Activate</span>
                                        </button>
                                      )}
                                      {status !== "SUSPENDED" && (
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleUserStatusChange(u, "SUSPENDED")}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors disabled:opacity-50"
                                        >
                                          <PauseCircle className="w-3 h-3" />
                                          <span>Suspend</span>
                                        </button>
                                      )}
                                      {status !== "BANNED" && (
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleUserStatusChange(u, "BANNED")}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50"
                                        >
                                          <Ban className="w-3 h-3" />
                                          <span>Ban</span>
                                        </button>
                                      )}
                                      {isBusy && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-teal" />
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* =============================================================
                  TAB 3: AUTO-DROP SCHEDULE OVERVIEW
                  ============================================================= */}
              {activeTab === "autodrop" && (
                <div className="space-y-4">
                  {/* Informational Milestone Notice */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-5 h-5 text-brand-amber shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-amber-950">
                        <p className="font-bold">
                          Read-Only Auto-Drop Dutch Auction Schedule Monitor
                        </p>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Automated batch price-drop execution, reserve-floor clamping, and
                          Observer-based watchlist notifications arrive in the{" "}
                          <strong>Final Milestone (Phase 7)</strong>.
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-amber text-white shrink-0 self-start sm:self-center">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Phase 7 Automation</span>
                    </span>
                  </div>

                  {/* Auto-Drop Schedule Table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                      <thead className="bg-[#232F3E] text-white text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-bold">Listing</th>
                          <th className="px-4 py-3 font-bold">Current Price</th>
                          <th className="px-4 py-3 font-bold">Min Reserve Floor</th>
                          <th className="px-4 py-3 font-bold">Drop Rule</th>
                          <th className="px-4 py-3 font-bold">Next Scheduled Drop</th>
                          <th className="px-4 py-3 font-bold">Schedule State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white text-xs">
                        {autoDropConfigs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                              No Auto-Drop schedules configured in the database.
                            </td>
                          </tr>
                        ) : (
                          autoDropConfigs.map((cfg) => {
                            const listingId = cfg.listing_id;
                            const title =
                              cfg.listing_title || cfg.title || `Listing #${listingId}`;
                            const currentPrice =
                              cfg.current_asking_price ?? cfg.current_price ?? 0;
                            const minReserve = cfg.min_reserve_price ?? 0;
                            const dropPct = cfg.drop_percentage ?? 5;
                            const intervalHours = cfg.interval_hours ?? 168;
                            const halted = Boolean(cfg.is_halted);
                            const overdue = !halted && isPastTimestamp(cfg.next_drop_at);

                            return (
                              <tr
                                key={cfg.config_id || listingId}
                                className="hover:bg-gray-50/80 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <Link
                                    href={`/listings/${listingId}`}
                                    className="font-bold text-gray-900 hover:text-brand-teal inline-flex items-center gap-1 transition-colors"
                                  >
                                    <span>{title}</span>
                                    <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                                  </Link>
                                  {cfg.listing_status && (
                                    <div className="mt-1">
                                      <Badge size="xs">{cfg.listing_status}</Badge>
                                    </div>
                                  )}
                                </td>

                                <td className="px-4 py-3 font-bold text-gray-900 tabular-nums">
                                  {formatCurrency(currentPrice)}
                                </td>

                                <td className="px-4 py-3 font-semibold text-brand-teal tabular-nums">
                                  {formatCurrency(minReserve)}
                                </td>

                                <td className="px-4 py-3 text-gray-600 tabular-nums">
                                  -{Number(dropPct)}% every {Math.round(intervalHours / 24)}d
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-800">
                                    {formatDateTime(cfg.next_drop_at)}
                                  </div>
                                  {overdue && (
                                    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>Due for Batch Drop</span>
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  {halted ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                                      Halted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Active
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* =====================================================================
          CONFIRM REMOVE LISTING MODAL (Routed through ListingAccessProxy)
          ===================================================================== */}
      {confirmRemoveReport && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <h2 id="confirm-remove-title" className="text-sm font-bold">
                  Remove Flagged Listing
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRemoveReport(null)}
                className="p-1 text-rose-100 hover:text-white rounded"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700">
                Resolve <strong>Report #{confirmRemoveReport.report_id}</strong> and permanently
                remove{" "}
                <strong className="text-gray-900">
                  &ldquo;
                  {confirmRemoveReport.listing_title ||
                    confirmRemoveReport.title ||
                    `Listing #${confirmRemoveReport.listing_id}`}
                  &rdquo;
                </strong>
                ?
              </p>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-start gap-2">
                <Lock className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                <span>
                  This action marks the report as <strong>ACTION_TAKEN</strong> and invokes{" "}
                  <strong className="text-gray-800">ListingAccessProxy.deleteListing()</strong>{" "}
                  using your verified administrator identity.
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveReport(null)}
                  disabled={processingReportId === confirmRemoveReport.report_id}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReportAction(confirmRemoveReport, "REMOVE_LISTING")}
                  disabled={processingReportId === confirmRemoveReport.report_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-60"
                >
                  {processingReportId === confirmRemoveReport.report_id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Remove Listing</span>
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
