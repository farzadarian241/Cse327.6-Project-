"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Heart,
  ShoppingCart,
  CheckCircle,
  Clock,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import StarRating from "@/components/shared/StarRating";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ listing, onWatchlistToggle, isWatchlisted = false }) {
  const { addToCart, isInCart } = useCart();
  const [saved, setSaved] = useState(isWatchlisted);
  const [addedToast, setAddedToast] = useState(false);

  if (!listing) return null;

  const {
    listing_id,
    title = "Untitled Listing",
    category = "General",
    original_price = 0,
    current_asking_price = 0,
    item_condition = "Good",
    pickup_location = "Dhaka Campus Area",
    listing_status = "AVAILABLE",
    auto_drop_enabled = false,
    next_drop_at = null,
    image_url = null,
    images = [],
    seller_name = "Campus Student",
    seller_rating = 4.8,
    seller_reviews = 10,
    is_campus_verified = false,
    is_negotiable = true,
    decorators = null,
  } = listing;

  // Resolve best image URL
  let resolvedImage = image_url;
  if (!resolvedImage && Array.isArray(images) && images.length > 0) {
    resolvedImage = images[0].image_url || images[0];
  }
  if (!resolvedImage) {
    // Category default photographic image
    if (category?.toLowerCase().includes("elect")) resolvedImage = "/uploads/defaults/laptop.jpg";
    else if (category?.toLowerCase().includes("furn")) resolvedImage = "/uploads/defaults/study-desk.jpg";
    else if (category?.toLowerCase().includes("cloth")) resolvedImage = "/uploads/defaults/winter-jacket.jpg";
    else resolvedImage = "/uploads/defaults/laptop.jpg";
  }

  // Savings calculation
  const orig = Number(original_price) || 0;
  const current = Number(current_asking_price) || 0;
  const savings = orig > current ? Math.round(((orig - current) / orig) * 100) : 0;

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      listing_id,
      title,
      current_asking_price: current,
      original_price: orig,
      image_url: resolvedImage,
      category,
      pickup_location,
      condition: item_condition,
      seller_name,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (onWatchlistToggle) {
      onWatchlistToggle(listing_id, nextSaved);
    }
  };

  const inCart = isInCart(listing_id);

  return (
    <div className="group relative flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-card-hover transition-all duration-200">
      {/* 4:3 Image Container with Badges */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        <Link href={`/listings/${listing_id}`} className="block w-full h-full">
          <img
            src={resolvedImage}
            alt={title}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>

        {/* Condition & Trust Badges (Top Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          <Badge variant="condition" size="xs">
            {item_condition}
          </Badge>
          {listing_status !== "AVAILABLE" && (
            <Badge size="xs">
              {listing_status}
            </Badge>
          )}
          {decorators?.campusVerifiedBadge && (
            <span
              title={decorators.campusVerifiedBadge.tooltip}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </span>
          )}
        </div>

        {/* Auto-Drop / Deal Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {(decorators?.autoDropBadge?.active ?? auto_drop_enabled) && (
            <span
              className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm"
              title={
                decorators?.autoDropBadge?.nextDropPrice
                  ? `Next drop: ৳${Number(decorators.autoDropBadge.nextDropPrice).toLocaleString()}`
                  : "Auto-Drop Dutch Auction"
              }
            >
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{decorators?.autoDropBadge?.label || "-5% Soon"}</span>
            </span>
          )}

          {/* Watchlist Bookmark Button */}
          <button
            type="button"
            onClick={handleWatchlist}
            aria-label="Save to Watchlist"
            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-rose-500 shadow-sm transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`}
            />
          </button>
        </div>

        {/* Category Tag (Bottom Left Overlay) */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
            {category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-3.5 justify-between">
        <div>
          {/* Title - 2 lines clamped */}
          <Link
            href={`/listings/${listing_id}`}
            className="block text-sm font-semibold text-gray-900 hover:text-brand-teal line-clamp-2 transition-colors mb-1.5 leading-snug"
            title={title}
          >
            {title}
          </Link>

          {/* Seller & Verification Row */}
          <div className="flex items-center justify-between gap-1 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1 truncate">
              <span className="truncate max-w-[120px] font-medium text-gray-700">
                {seller_name}
              </span>
              {(decorators?.campusVerifiedBadge?.verified ?? is_campus_verified) && (
                <span
                  title={decorators?.campusVerifiedBadge?.tooltip || "Campus Verified Student"}
                  className="inline-flex text-emerald-600"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <StarRating
              rating={seller_rating}
              totalReviews={seller_reviews}
              size="xs"
              showCount={false}
            />
          </div>

          {/* Price Section */}
          <div className="mt-1 mb-2">
            <div className="flex items-baseline flex-wrap gap-2">
              <span className="text-lg font-bold text-gray-900 tabular-nums">
                ৳{Number(current).toLocaleString()}
              </span>
              {orig > current && (
                <span className="text-xs text-gray-400 line-through tabular-nums">
                  ৳{Number(orig).toLocaleString()}
                </span>
              )}
              {decorators?.savingsBadge ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {decorators.savingsBadge.label}
                </span>
              ) : savings > 0 ? (
                <span className="text-xs font-semibold text-emerald-600">
                  {savings}% off
                </span>
              ) : null}
            </div>
            {is_negotiable && (
              <p className="text-[11px] text-amber-700 font-medium">
                Make an Offer (70%-85% allowed)
              </p>
            )}
          </div>

          {/* Pickup Location */}
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-3 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="truncate">{pickup_location}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
          <Link
            href={`/listings/${listing_id}`}
            className="flex-1 text-center py-1.5 px-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={handleCartClick}
            disabled={listing_status !== "AVAILABLE" || inCart}
            className={`py-1.5 px-2.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
              inCart
                ? "bg-emerald-600 text-white cursor-default"
                : listing_status !== "AVAILABLE"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brand-amber hover:bg-brand-amberHover text-white shadow-sm"
            }`}
            title={inCart ? "In your cart" : "Add to Cart"}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{inCart ? "In Cart" : "Add"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
