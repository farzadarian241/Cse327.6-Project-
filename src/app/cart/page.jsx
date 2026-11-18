"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Lock,
  MapPin,
  User,
  ShieldCheck,
  Info,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import Badge from "@/components/shared/Badge";

function formatBDT(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${Math.round(num).toLocaleString("en-US")}`;
}

function resolveItemImage(item) {
  if (item?.image_url) return item.image_url;
  const cat = (item?.category || "").toLowerCase();
  if (cat.includes("elect")) return "/uploads/defaults/laptop.jpg";
  if (cat.includes("furn")) return "/uploads/defaults/study-desk.jpg";
  if (cat.includes("cloth")) return "/uploads/defaults/winter-jacket.jpg";
  return "/uploads/defaults/laptop.jpg";
}

export default function CartPage() {
  const { items, itemCount, subtotal, removeFromCart, clearCart } = useCart();

  const totalOriginal = items.reduce((sum, item) => {
    const orig = Number(item.original_price) || 0;
    const curr = Number(item.current_asking_price || item.price || 0);
    return sum + (orig > curr ? orig : curr);
  }, 0);
  const totalSavings = totalOriginal > subtotal ? Math.round(totalOriginal - subtotal) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#131921] via-[#232F3E] to-[#134E4A] text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-teal-300 font-semibold uppercase tracking-wider mb-1">
            <Link href="/" className="hover:underline text-gray-300">
              Home
            </Link>
            <span className="text-gray-500">/</span>
            <span>Shopping Cart</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-brand-amber" />
            <span>Your Shopping Cart</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            {itemCount === 0
              ? "Your cart is currently empty."
              : `${itemCount} pre-owned campus ${itemCount === 1 ? "item" : "items"} saved for handover.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          {itemCount > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>
      </section>

      {/* Empty Cart State */}
      {itemCount === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1.5">
            Your HaatBodol Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
            Explore pre-owned laptops, study desks, winter jackets, and Auto-Drop Dutch auction deals from verified campus students.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-sm font-bold shadow-sm transition-colors"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/listings?autodrop=true"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors"
            >
              <span>View Auto-Drop Deals</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Populated Cart Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-3">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-teal" />
                  <span>
                    Cart Items ({itemCount})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cart</span>
                </button>
              </div>

              <ul className="divide-y divide-gray-100">
                {items.map((item) => {
                  const price = Number(item.current_asking_price || item.price || 0);
                  const orig = Number(item.original_price) || 0;
                  const itemCondition = item.condition || item.item_condition || "Good";

                  return (
                    <li
                      key={item.listing_id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Thumbnail */}
                      <Link
                        href={`/listings/${item.listing_id}`}
                        className="w-full sm:w-28 h-28 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 group"
                      >
                        <img
                          src={resolveItemImage(item)}
                          alt={item.title || "Cart item"}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        />
                      </Link>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="condition" size="xs">
                            {itemCondition}
                          </Badge>
                          {item.category && (
                            <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/listings/${item.listing_id}`}
                          className="block text-sm sm:text-base font-bold text-gray-900 hover:text-brand-teal transition-colors leading-snug"
                        >
                          {item.title}
                        </Link>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                          {item.seller_name && (
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span>
                                Seller: <strong className="text-gray-800">{item.seller_name}</strong>
                              </span>
                            </span>
                          )}
                          {item.pickup_location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate max-w-[240px]">
                                {item.pickup_location}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                          <Link
                            href={`/listings/${item.listing_id}`}
                            className="text-xs font-semibold text-brand-teal hover:underline"
                          >
                            View Listing Details
                          </Link>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.listing_id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Price Column */}
                      <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex-shrink-0">
                        <span className="text-lg font-black text-gray-900 tabular-nums">
                          {formatBDT(price)}
                        </span>
                        {orig > price && (
                          <div className="flex items-center gap-1.5 sm:flex-col sm:items-end sm:gap-0.5">
                            <span className="text-xs text-gray-400 line-through tabular-nums">
                              {formatBDT(orig)}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700">
                              Save {formatBDT(orig - price)}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-4">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm sticky top-28">
              <div className="bg-[#131921] text-white px-5 py-3.5">
                <h2 className="text-sm font-bold tracking-tight">Order Summary</h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>
                      Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </span>
                    <span className="font-bold text-gray-900 tabular-nums">
                      {formatBDT(subtotal)}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                      <span>Retail Savings</span>
                      <span className="tabular-nums">-{formatBDT(totalSavings)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-gray-600 text-xs">
                    <span>Campus Handover Fee</span>
                    <span className="font-semibold text-emerald-700">Free</span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">Estimated Total</span>
                    <span className="text-xl font-black text-gray-900 tabular-nums">
                      {formatBDT(subtotal)}
                    </span>
                  </div>
                </div>

                {/* Disabled / Informational Checkout Button for Final Milestone */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-3 px-4 rounded-xl bg-gray-200 text-gray-500 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-gray-300"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Checkout (Final Milestone)</span>
                  </button>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Info className="w-4 h-4 text-brand-amber flex-shrink-0" />
                      <span>Coming in Phase 8 — Final Milestone</span>
                    </div>
                    <p className="text-[11px] text-amber-900/85 leading-relaxed">
                      Full checkout, payment method selection, atomic <strong>Deal Lock</strong>{" "}
                      reservation, and post-acceptance contact unlock arrive in Phase 8.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-start gap-2 text-[11px] text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span>
                    All campus purchases are intended for safe in-person verification at university landmarks.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
