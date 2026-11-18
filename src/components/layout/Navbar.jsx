"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Bell,
  Heart,
  User,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Menu,
  X,
  MapPin,
  PlusCircle,
  Repeat,
  Package,
  LogOut,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const router = useRouter();
  const { user, activeRole, switchRole, unreadNotifications, isCampusVerified, logout } = useAuth();
  const { itemCount } = useCart();

  // Search state
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // UI Dropdown states
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState("Dhaka Campuses (NSU / BRACU / DU)");

  const accountRef = useRef(null);
  const notificationRef = useRef(null);
  const locationRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (searchCategory !== "all") params.set("category", searchCategory);
    router.push(`/listings?${params.toString()}`);
  };

  const campuses = [
    "Dhaka Campuses (NSU / BRACU / DU)",
    "Bashundhara R/A (NSU / IUB)",
    "Merul Badda / Mohakhali (BRACU)",
    "Nilkhet / Shahbagh (DU Campus)",
    "Dhanmondi (UIU / DIU Area)",
    "Agargaon / Mirpur Area",
  ];

  return (
    <header className="w-full flex flex-col z-50 sticky top-0 shadow-md">
      {/* -------------------------------------------------------------
          TOP BAR (#131921)
          ------------------------------------------------------------- */}
      <div className="bg-[#131921] text-white px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 border-b border-[#232F3E]">
        {/* Brand Logo - The ONLY Bangla word allowed on the website */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 focus:outline-none group"
            aria-label="HaatBodol Home"
          >
            <div className="flex flex-col leading-none">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                হাত<span className="text-brand-amber">বদল</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-gray-300">
                HaatBodol
              </span>
            </div>
          </Link>

          {/* Campus Location Selector Pill (Desktop) */}
          <div className="relative hidden lg:block" ref={locationRef}>
            <button
              type="button"
              onClick={() => setLocationMenuOpen(!locationMenuOpen)}
              className="flex items-center gap-1.5 text-left px-2 py-1 rounded hover:border hover:border-gray-500 border border-transparent transition-all"
            >
              <MapPin className="w-4 h-4 text-brand-amber flex-shrink-0" />
              <div className="leading-tight">
                <span className="text-[10px] text-gray-400 block font-normal">Deliver to Campus</span>
                <span className="text-xs font-bold text-white truncate max-w-[130px] block">
                  {selectedCampus.split(" ")[0]} Area
                </span>
              </div>
            </button>

            {locationMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white text-gray-800 rounded-md shadow-xl border border-gray-200 p-2 z-50">
                <p className="text-xs font-bold text-gray-500 px-2 py-1 uppercase tracking-wider">
                  Select University / Area
                </p>
                {campuses.map((campus) => (
                  <button
                    key={campus}
                    type="button"
                    onClick={() => {
                      setSelectedCampus(campus);
                      setLocationMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 flex items-center justify-between ${
                      selectedCampus === campus ? "font-bold text-brand-teal bg-teal-50" : ""
                    }`}
                  >
                    <span>{campus}</span>
                    {selectedCampus === campus && <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Integrated Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-2xl items-center rounded-md overflow-hidden bg-white shadow-inner focus-within:ring-2 focus-within:ring-brand-amber"
        >
          {/* Category Dropdown */}
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2.5 border-r border-gray-300 focus:outline-none hover:bg-gray-200 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Electronic Devices">Electronic Devices</option>
            <option value="Furniture">Furniture</option>
            <option value="Clothing">Clothing</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pre-owned laptops, study desks, winter jackets..."
            className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
          />

          {/* Amber Submit Button */}
          <button
            type="submit"
            aria-label="Submit search"
            className="bg-brand-amber hover:bg-brand-amberHover text-white px-4 py-2.5 flex items-center justify-center transition-colors"
          >
            <Search className="w-4 h-4 text-white" />
          </button>
        </form>

        {/* Header Actions Right */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Notifications Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
              className="p-1.5 sm:px-2 sm:py-1 rounded hover:border hover:border-gray-500 border border-transparent text-gray-200 hover:text-white flex items-center relative transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-brand-amber text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-[#131921]">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {notificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-md shadow-2xl border border-gray-200 p-3 z-50">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                  <span className="text-xs text-brand-teal font-semibold">
                    {unreadNotifications} New
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-amber-50 border-l-4 border-brand-amber rounded">
                    <p className="font-semibold text-gray-900">Auto-Drop Price Alert</p>
                    <p className="text-gray-600 mt-0.5">Sony WH-1000XM4 dropped by 5% to ৳18,525.</p>
                    <span className="text-[10px] text-gray-400">10m ago</span>
                  </div>
                  <div className="p-2 bg-teal-50 border-l-4 border-brand-teal rounded">
                    <p className="font-semibold text-gray-900">New Offer Received</p>
                    <p className="text-gray-600 mt-0.5">Nusrat submitted a 75% offer on MacBook Air M1.</p>
                    <span className="text-[10px] text-gray-400">2h ago</span>
                  </div>
                  <div className="p-2 bg-gray-50 border-l-4 border-gray-300 rounded">
                    <p className="font-semibold text-gray-900">Campus Verification</p>
                    <p className="text-gray-600 mt-0.5">Your NSU institutional student status is verified.</p>
                    <span className="text-[10px] text-gray-400">1d ago</span>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setNotificationMenuOpen(false)}
                  className="block text-center mt-3 pt-2 border-t text-xs font-semibold text-brand-teal hover:underline"
                >
                  View All in Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Watchlist Shortcut */}
          <Link
            href="/dashboard?tab=watchlist"
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded hover:border hover:border-gray-500 border border-transparent text-gray-200 hover:text-white transition-all"
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <div className="leading-tight text-left">
              <span className="text-[10px] text-gray-400 block font-normal">Saved</span>
              <span className="text-xs font-bold text-white block">Watchlist</span>
            </div>
          </Link>

          {/* Account & Role Switcher Dropdown */}
          <div className="relative" ref={accountRef}>
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:border hover:border-gray-500 border border-transparent text-left transition-all"
                  aria-label="Account and user role menu"
                >
                  <div className="leading-tight hidden sm:block">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 block truncate max-w-[100px]">
                        Hello, {user.full_name ? user.full_name.split(" ")[0] : "User"}
                      </span>
                      {isCampusVerified && (
                        <span
                          className="inline-flex items-center text-teal-400"
                          title="Campus Verified Student"
                        >
                          <ShieldCheck className="w-3 h-3 text-teal-400" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-0.5">
                        Account & Lists <ChevronDown className="w-3 h-3 text-gray-400" />
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          activeRole === "SELLER"
                            ? "bg-brand-amber text-white"
                            : "bg-brand-teal text-white"
                        }`}
                      >
                        {activeRole}
                      </span>
                    </div>
                  </div>
                  <div className="sm:hidden p-1 flex items-center gap-1">
                    <User className="w-5 h-5 text-gray-200" />
                    {isCampusVerified && <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-md shadow-2xl border border-gray-200 p-4 z-50">
                    {/* User Info Header */}
                    <div className="border-b pb-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="truncate mr-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {user.full_name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {isCampusVerified && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-teal bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full shrink-0"
                            title="Campus Verified Student"
                          >
                            <ShieldCheck className="w-3 h-3 text-brand-teal" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Instant Role Switcher Section */}
                    <div className="mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5 text-brand-amber" />
                          Active Role:
                        </span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            activeRole === "SELLER"
                              ? "bg-brand-amber text-white"
                              : "bg-brand-teal text-white"
                          }`}
                        >
                          {activeRole} MODE
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 mb-2">
                        {activeRole === "BUYER"
                          ? "Browsing student deals and submitting offers."
                          : "Managing product listings and responding to offers."}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          switchRole();
                        }}
                        className="w-full py-1.5 px-3 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-semibold text-gray-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Repeat className="w-3 h-3 text-brand-teal" />
                        <span>Switch to {activeRole === "BUYER" ? "Seller" : "Buyer"} Mode</span>
                      </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1 text-xs">
                      {user?.account_type === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center justify-between p-2 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold mb-1.5 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                            <span>Admin Panel</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
                        </Link>
                      )}
                      <Link
                        href="/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-100 font-medium text-gray-700"
                      >
                        <span>User Dashboard</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </Link>
                      <Link
                        href="/dashboard?tab=offers"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-100 font-medium text-gray-700"
                      >
                        <span>Offers & Bargaining Deals</span>
                      </Link>
                      <Link
                        href="/dashboard?tab=listings"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-100 font-medium text-gray-700"
                      >
                        <span>My Inventory Listings</span>
                      </Link>
                      <Link
                        href="/listings/new"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-teal-50 text-brand-teal font-semibold"
                      >
                        <span>+ List New Pre-Owned Item</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t mt-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full text-left p-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1.5 font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:border hover:border-gray-500 border border-transparent text-left transition-all text-white group"
                aria-label="Hello, Sign in / Accounts"
              >
                <div className="leading-tight hidden sm:block">
                  <span className="text-[10px] text-gray-300 block group-hover:text-amber-400 transition-colors">
                    Hello, Sign in
                  </span>
                  <span className="text-xs font-bold text-white block">
                    Accounts
                  </span>
                </div>
                <div className="sm:hidden p-1">
                  <User className="w-5 h-5 text-gray-200" />
                </div>
              </Link>
            )}
          </div>

          {/* Cart Shortcut Button */}
          <Link
            href="/cart"
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:border hover:border-gray-500 border border-transparent text-white transition-all relative"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-brand-amber" />
              <span className="absolute -top-1 -right-2 bg-brand-amber text-white text-[11px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-[#131921] tabular-nums">
                {itemCount}
              </span>
            </div>
            <span className="text-xs font-bold hidden sm:inline text-white">Cart</span>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-gray-200 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SUB-NAV BAR (#232F3E)
          ------------------------------------------------------------- */}
      <nav className="bg-[#232F3E] text-white px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/listings"
            className="flex items-center gap-1 hover:text-amber-400 transition-colors py-0.5 font-semibold"
          >
            <Menu className="w-4 h-4" />
            <span>All Listings</span>
          </Link>
          <Link
            href="/listings?category=Electronic+Devices"
            className="hover:text-amber-400 transition-colors py-0.5"
          >
            Electronic Devices
          </Link>
          <Link
            href="/listings?category=Furniture"
            className="hover:text-amber-400 transition-colors py-0.5"
          >
            Furniture
          </Link>
          <Link
            href="/listings?category=Clothing"
            className="hover:text-amber-400 transition-colors py-0.5"
          >
            Clothing
          </Link>
          <Link
            href="/listings?autodrop=true"
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold py-0.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Drop Deals</span>
          </Link>
          <Link
            href="/listings?verified=true"
            className="flex items-center gap-1 text-teal-300 hover:text-teal-200 font-semibold py-0.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Campus Verified</span>
          </Link>
          {user?.account_type === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-purple-300 hover:text-purple-200 font-bold py-0.5 px-2 rounded bg-purple-900/40 border border-purple-500/40 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>

        {/* Primary "+ Sell an Item" CTA */}
        <div className="flex items-center pl-4">
          <Link
            href="/listings/new"
            className="bg-brand-amber hover:bg-brand-amberHover text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Sell an Item</span>
          </Link>
        </div>
      </nav>

      {/* -------------------------------------------------------------
          MOBILE NAVIGATION DRAWER
          ------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#131921] border-b border-gray-700 text-white px-4 py-3 space-y-3">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex rounded overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pre-owned items..."
              className="flex-1 px-3 py-2 text-xs text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-brand-amber px-3 py-2 text-white flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Mobile Quick Links */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <Link
              href="/listings"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-[#232F3E] rounded hover:bg-gray-700"
            >
              All Listings
            </Link>
            <Link
              href="/listings?category=Electronic+Devices"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-[#232F3E] rounded hover:bg-gray-700"
            >
              Electronic Devices
            </Link>
            <Link
              href="/listings?category=Furniture"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-[#232F3E] rounded hover:bg-gray-700"
            >
              Furniture
            </Link>
            <Link
              href="/listings?category=Clothing"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-[#232F3E] rounded hover:bg-gray-700"
            >
              Clothing
            </Link>
            <Link
              href="/listings?autodrop=true"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-[#232F3E] text-amber-300 rounded hover:bg-gray-700 font-semibold"
            >
              Auto-Drop Deals
            </Link>
            <Link
              href="/listings?verified=true"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-[#232F3E] text-teal-300 rounded hover:bg-gray-700 font-semibold"
            >
              Campus Verified
            </Link>
          </div>

          {/* User Auth Section in Mobile Drawer */}
          {user ? (
            <div className="pt-2 border-t border-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[180px]">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{user.email}</p>
                </div>
                {isCampusVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-300 bg-teal-900/50 border border-teal-500/40 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-300">
                  Role: <strong className="text-amber-400">{activeRole}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => switchRole()}
                  className="text-xs font-semibold px-2 py-1 bg-[#232F3E] rounded hover:bg-gray-700 text-teal-300"
                >
                  Switch Role
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-[#232F3E] rounded hover:bg-gray-700 text-center font-medium text-gray-200"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard?tab=watchlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-[#232F3E] rounded hover:bg-gray-700 text-center font-medium text-rose-300"
                >
                  Watchlist
                </Link>
              </div>
              {user?.account_type === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 px-3 bg-purple-900/50 border border-purple-500/50 hover:bg-purple-900/70 text-purple-200 font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-1 text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-700 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-brand-amber hover:bg-brand-amberHover text-white font-bold rounded text-xs block transition-colors shadow-sm"
              >
                Hello, Sign in / Accounts
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs text-gray-300 hover:text-white block py-1"
              >
                New customer? Start here
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
