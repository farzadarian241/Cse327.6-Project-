import React from "react";
import Link from "next/link";
import {
  TrendingDown,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Lock,
  Tag,
  CheckCircle2,
  Users,
  Search,
  PlusCircle,
  HelpCircle,
  Laptop,
  Armchair,
  Shirt,
} from "lucide-react";
import ProductCard from "@/components/listings/ProductCard";

export const dynamic = "force-dynamic";

// Comprehensive fallback data in case the Java backend is unreachable or during build
const FALLBACK_LISTINGS = [
  {
    listing_id: 1,
    title: "MacBook Air M1 8GB/256GB - Space Gray",
    description: "Used for 14 months for computer science coursework. Excellent battery health (92%).",
    category: "Electronic Devices",
    original_price: 88000,
    current_asking_price: 58000,
    item_condition: "Like New",
    pickup_location: "North South University Gate 8, Bashundhara R/A",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: true,
    seller_name: "Tanvir Ahmed",
    is_campus_verified: true,
    seller_rating: 4.9,
    seller_reviews: 14,
    image_url: "/uploads/products/macbook-air-m1.jpg",
    next_drop_at: "2026-11-18T18:34:16.000Z",
    min_reserve_price: 48000,
  },
  {
    listing_id: 2,
    title: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
    description: "Flagship active noise cancelling over-ear headphones. Great for studying in libraries.",
    category: "Electronic Devices",
    original_price: 32000,
    current_asking_price: 19500,
    item_condition: "Good",
    pickup_location: "Dhanmondi 27 (near Cafe Mango), Dhaka",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: true,
    seller_name: "Rafiul Islam",
    is_campus_verified: false,
    seller_rating: 4.5,
    seller_reviews: 5,
    image_url: "/uploads/products/sony-wh1000xm4.jpg",
    next_drop_at: "2026-11-15T17:34:16.000Z",
    min_reserve_price: 16000,
  },
  {
    listing_id: 3,
    title: "Samsung Galaxy S22 5G (Phantom Black, 128GB)",
    description: "Compact flagship smartphone. Clean display with glass protector applied from day one.",
    category: "Electronic Devices",
    original_price: 75000,
    current_asking_price: 33500,
    item_condition: "Fair",
    pickup_location: "Bashundhara R/A Block C, Dhaka",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: true,
    seller_name: "Tanvir Ahmed",
    is_campus_verified: true,
    seller_rating: 4.9,
    seller_reviews: 14,
    image_url: "/uploads/products/samsung-s22.jpg",
    next_drop_at: "2026-11-19T18:34:16.000Z",
    min_reserve_price: 28000,
  },
  {
    listing_id: 5,
    title: "Solid Segun Wood Student Study Desk with 3 Drawers",
    description: "Heavy handcrafted solid mahogany/segun study table. Built-in cable management hole.",
    category: "Furniture",
    original_price: 14500,
    current_asking_price: 8500,
    item_condition: "Good",
    pickup_location: "Dhanmondi Road 8/A, Dhaka",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: true,
    seller_name: "Rafiul Islam",
    is_campus_verified: false,
    seller_rating: 4.5,
    seller_reviews: 5,
    image_url: "/uploads/products/wooden-study-desk.jpg",
    next_drop_at: "2026-11-20T18:34:16.000Z",
    min_reserve_price: 7000,
  },
  {
    listing_id: 7,
    title: "Compact 4-Tier Engineered Wood Bookshelf",
    description: "Lightweight space-saving bookshelf designed for university student dorms.",
    category: "Furniture",
    original_price: 5200,
    current_asking_price: 2400,
    item_condition: "Fair",
    pickup_location: "Dhaka University Curzon Hall Gate",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: true,
    seller_name: "Sadia Rahman",
    is_campus_verified: true,
    seller_rating: 5.0,
    seller_reviews: 11,
    image_url: "/uploads/products/compact-bookshelf.jpg",
    next_drop_at: "2026-11-21T18:34:16.000Z",
    min_reserve_price: 1800,
  },
  {
    listing_id: 8,
    title: "Adjustable Metal Frame Bedside Laptop Table",
    description: "Wheeled multi-angle height adjustable bed desk. Great for studying in bed.",
    category: "Furniture",
    original_price: 3800,
    current_asking_price: 1400,
    item_condition: "Needs Repair",
    pickup_location: "Mohakhali Wireless Gate, Dhaka",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: false,
    seller_name: "Nusrat Jahan",
    is_campus_verified: true,
    seller_rating: 4.8,
    seller_reviews: 8,
    image_url: "/uploads/products/bedside-laptop-table.jpg",
    next_drop_at: null,
    min_reserve_price: null,
  },
  {
    listing_id: 9,
    title: "North Face Windproof Thermal Winter Down Jacket (Size L)",
    description: "Authentic waterproof breathable goose down jacket with detachable fleece hood.",
    category: "Clothing",
    original_price: 16500,
    current_asking_price: 7900,
    item_condition: "Like New",
    pickup_location: "NSU Campus Plaza, Bashundhara R/A",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: false,
    seller_name: "Tanvir Ahmed",
    is_campus_verified: true,
    seller_rating: 4.9,
    seller_reviews: 14,
    image_url: "/uploads/products/north-face-jacket.jpg",
    next_drop_at: null,
    min_reserve_price: null,
  },
  {
    listing_id: 10,
    title: "Nike Air Max 270 Running Shoes (Size UK 9 / EU 43)",
    description: "Triple black colorway. Cushioned large volume Max Air unit heel. Sole grip in 85% condition.",
    category: "Clothing",
    original_price: 13500,
    current_asking_price: 5400,
    item_condition: "Good",
    pickup_location: "Dhanmondi Lakefront (Rabindra Sarobar)",
    listing_status: "AVAILABLE",
    is_negotiable: true,
    auto_drop_enabled: false,
    seller_name: "Rafiul Islam",
    is_campus_verified: false,
    seller_rating: 4.5,
    seller_reviews: 5,
    image_url: "/uploads/products/nike-air-max-270.jpg",
    next_drop_at: null,
    min_reserve_price: null,
  },
];

async function getHomepageData() {
  const backendApiUrl = (process.env.BACKEND_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");
  try {
    const response = await fetch(`${backendApiUrl}/api/listings`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.listings) && data.listings.length > 0) {
        return data.listings;
      }
    }
  } catch (err) {
    console.warn("Could not reach Java backend API for homepage, using fallback:", err.message);
  }
  return FALLBACK_LISTINGS;
}

export default async function HomePage() {
  const listings = await getHomepageData();

  // Filter Auto-Drop active deals
  const autoDropDeals = listings.filter((item) => Boolean(item.auto_drop_enabled));

  // Category counts
  const electronicsCount = listings.filter((i) => i.category === "Electronic Devices").length;
  const furnitureCount = listings.filter((i) => i.category === "Furniture").length;
  const clothingCount = listings.filter((i) => i.category === "Clothing").length;

  return (
    <div className="space-y-10 pb-8">
      {/* ----------------------------------------------------------------
          1. HERO BANNER
          ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#131921] via-[#232F3E] to-[#0F766E] text-white shadow-xl">
        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 max-w-4xl">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dedicated Campus Marketplace for Dhaka University Students</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Buy & Sell Pre-Owned Student Goods on Campus
          </h1>

          <p className="text-sm sm:text-base text-gray-200 max-w-2xl leading-relaxed mb-8">
            Experience fair dynamic depreciation estimates, anti-lowball bargaining with
            strict 70%–85% offer bounds, and automated weekly 5% price drops for fast clearance.
          </p>

          {/* Dual Primary Call-to-Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/listings"
              className="px-6 py-3 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <span>Explore Student Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/listings/new"
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 text-sm font-semibold flex items-center gap-2 backdrop-blur-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>+ Sell an Item</span>
            </Link>
          </div>

          {/* 4 Feature Value Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-white/10 text-xs text-gray-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Campus Verified (.edu)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>70%–85% Fair Bargaining</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Auto-Drop Dutch Auctions</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Masked Contact Privacy</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-teal/30 to-transparent pointer-events-none" />
      </section>

      {/* ----------------------------------------------------------------
          2. 3 CATEGORY SHOWCASE CARDS
          ---------------------------------------------------------------- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Shop by Campus Category
            </h2>
            <p className="text-xs text-gray-500">
              Pre-owned goods verified and traded locally between campus residents
            </p>
          </div>
          <Link
            href="/listings"
            className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Category 1: Electronic Devices */}
          <Link
            href="/listings?category=Electronic+Devices"
            className="group relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-teal uppercase tracking-wider">
                  Technology
                </span>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-teal transition-colors">
                  Electronic Devices
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Laptops, smartphones, tablets, monitors, and noise-cancelling headphones.
                </p>
              </div>
              <div className="p-3 bg-teal-50 text-brand-teal rounded-lg">
                <Laptop className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-600">
                {electronicsCount} Items Listed
              </span>
              <span className="text-xs font-bold text-brand-teal group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Browse Category <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Category 2: Furniture */}
          <Link
            href="/listings?category=Furniture"
            className="group relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Study & Dorm
                </span>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                  Furniture
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Solid wood study desks, ergonomic chairs, bookshelves, and bed tables.
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Armchair className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-600">
                {furnitureCount} Items Listed
              </span>
              <span className="text-xs font-bold text-brand-amber group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Browse Category <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Category 3: Clothing */}
          <Link
            href="/listings?category=Clothing"
            className="group relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  Wardrobe & Style
                </span>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                  Clothing
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Winter jackets, campus casual sneakers, university hoodies, and formal wear.
                </p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Shirt className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-600">
                {clothingCount} Items Listed
              </span>
              <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Browse Category <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------------
          3. AUTO-DROP DUTCH AUCTION DEALS STRIP
          ---------------------------------------------------------------- */}
      {autoDropDeals.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-amber text-white rounded-lg shadow-sm">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Auto-Drop Dutch Auction Deals
                  </h2>
                  <span className="bg-brand-amber text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    -5% Weekly Drops
                  </span>
                </div>
                <p className="text-xs text-amber-900/80">
                  Prices automatically drop by 5% every 7 days until reserved or purchased.
                </p>
              </div>
            </div>

            <Link
              href="/listings?autodrop=true"
              className="text-xs font-bold text-brand-amber hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All Dutch Auctions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {autoDropDeals.slice(0, 4).map((listing) => (
              <ProductCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------
          4. RECENTLY LISTED ITEMS GRID
          ---------------------------------------------------------------- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Recently Listed Items
            </h2>
            <p className="text-xs text-gray-500">
              Fresh additions available for immediate purchase or structured 70%–85% offers
            </p>
          </div>
          <Link
            href="/listings"
            className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
          >
            <span>See All Listings ({listings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {listings.map((listing) => (
            <ProductCard key={listing.listing_id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------
          5. SAFETY & TRUST HIGHLIGHT SECTION
          ---------------------------------------------------------------- */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-brand-teal uppercase tracking-widest">
            Safe & Trustworthy Commerce
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            Built Specifically for University Communities
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            HaatBodol eliminates the chaos of unstructured classified groups with verified
            identities, anti-lowball limits, and privacy-protected meetups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center">
            <div className="p-3 bg-teal-100 text-brand-teal rounded-full mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Campus Verified Badges</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Verified with official university emails (.edu / .edu.bd) from NSU, BRACU, DU, and more.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center">
            <div className="p-3 bg-amber-100 text-brand-amber rounded-full mb-3">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">No-Lowball Bargaining</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Offer slider is constrained strictly between 70% and 85% with a max of 3 rounds per item.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Deal Locking & Privacy</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Seller phone numbers and locations unlock exclusively after mutual offer acceptance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-full mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Public Campus Handover</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Recommended safe exchange zones at university gates, campus cafeterias, and library plazas.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------
          6. SELLER CALL-TO-ACTION CONVERSION STRIP
          ---------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-brand-teal to-[#115E59] text-white rounded-2xl p-6 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl">
          <h3 className="text-2xl font-black mb-2">
            Graduating, Moving Dorms, or Upgrading Gear?
          </h3>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            List your pre-owned laptops, study tables, or clothing in under 2 minutes. Our
            Dynamic Depreciation Estimator recommends a fair resale range automatically.
          </p>
        </div>

        <Link
          href="/listings/new"
          className="px-6 py-3.5 rounded-lg bg-brand-amber hover:bg-brand-amberHover text-white text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create a Listing Now</span>
        </Link>
      </section>
    </div>
  );
}
