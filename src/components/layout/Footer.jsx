"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronUp,
  MapPin,
  Lock,
  Sparkles,
  HeartHandshake,
} from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full bg-[#131921] text-gray-300 mt-auto border-t border-[#232F3E]">
      {/* Back to Top Bar */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-full bg-[#232F3E] hover:bg-[#2a3749] text-gray-200 text-xs font-semibold py-3 flex items-center justify-center gap-1.5 transition-colors border-b border-gray-700"
      >
        <ChevronUp className="w-4 h-4" />
        <span>Back to Top</span>
      </button>

      {/* Main Footer Links Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-3">
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tight text-white">
                হাত<span className="text-brand-amber">বদল</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-gray-400">
                HaatBodol Marketplace
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              The premier peer-to-peer used goods marketplace tailored for university students and local residents in Dhaka. Fair depreciation pricing, structured bargaining, and secure campus pickups.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Campus Verified Student Community</span>
            </div>
          </div>

          {/* Column 2: Campus Safety Guidelines */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Campus Safety First
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-amber flex-shrink-0 mt-0.5" />
                <span>Meet in well-lit public campus zones (NSU Gate 8, BRACU Plaza, DU Curzon Hall).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
                <span>Contact details remain masked until an offer is formally locked.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>Inspect items in person before completing handover and payment.</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Browse Marketplace Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Categories
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link
                  href="/listings?category=Electronic+Devices"
                  className="hover:text-amber-400 transition-colors"
                >
                  Electronic Devices (Laptops, Phones & Audio)
                </Link>
              </li>
              <li>
                <Link
                  href="/listings?category=Furniture"
                  className="hover:text-amber-400 transition-colors"
                >
                  Furniture (Desks, Chairs & Bookshelves)
                </Link>
              </li>
              <li>
                <Link
                  href="/listings?category=Clothing"
                  className="hover:text-amber-400 transition-colors"
                >
                  Clothing (Jackets, Footwear & Casuals)
                </Link>
              </li>
              <li>
                <Link
                  href="/listings?autodrop=true"
                  className="hover:text-amber-400 text-amber-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-brand-amber" />
                  <span>Auto-Drop Dutch Auctions (-5% Weekly)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/listings/new"
                  className="hover:text-teal-300 text-brand-teal font-semibold transition-colors"
                >
                  + Sell Your Used Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Trust & Transparency
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/listings" className="hover:text-amber-400 transition-colors">
                  Dynamic Depreciation Estimator
                </Link>
              </li>
              <li>
                <Link href="/listings" className="hover:text-amber-400 transition-colors">
                  70% to 85% Anti-Lowball Bargaining
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition-colors">
                  Student Institutional Verification (.edu)
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition-colors">
                  Moderator & Safety Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright and English compliance note */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <p>© 2026 HaatBodol (হাতবদল). All rights reserved. Built for Dhaka university communities.</p>
          <div className="flex items-center gap-4">
            <Link href="/listings" className="hover:text-gray-300 transition-colors">
              Terms of Use
            </Link>
            <Link href="/listings" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/admin" className="hover:text-gray-300 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
