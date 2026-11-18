"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Clock,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  FileText,
  DollarSign,
  HelpCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DepreciationBox from "@/components/listings/DepreciationBox";

const CATEGORIES = [
  { id: "Electronic Devices", label: "Electronic Devices", desc: "Laptops, smartphones, tablets, accessories" },
  { id: "Furniture", label: "Furniture", desc: "Desks, study chairs, beds, shelves, lamps" },
  { id: "Clothing", label: "Clothing", desc: "Campus apparel, jackets, shoes, formal wear" },
];

const CONDITIONS = [
  {
    id: "Like New",
    label: "Like New",
    desc: "Flawless condition, barely used, with original box or tags",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "Good",
    label: "Good",
    desc: "Minor cosmetic wear, fully operational with all essential features",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
  },
  {
    id: "Fair",
    label: "Fair",
    desc: "Visible signs of wear and age, 100% functional and reliable",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "Needs Repair",
    label: "Needs Repair",
    desc: "Defective part or physical issue, ideal for repair or parts",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
  },
];

const CAMPUS_SUGGESTIONS = [
  "Bashundhara R/A (NSU / IUB Campus)",
  "Mohakhali / Merul Badda (BRACU Campus)",
  "Nilkhet / Shahbagh (DU Campus)",
  "Dhanmondi (UIU / DIU Area)",
  "Mirpur Campus Zone",
  "Uttara Residential Area",
];

export default function NewListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronic Devices");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("Good");
  const [ageInMonths, setAgeInMonths] = useState("6");
  const [originalPrice, setOriginalPrice] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [autoDropEnabled, setAutoDropEnabled] = useState(false);
  const [minReservePrice, setMinReservePrice] = useState("");
  const [pickupLocation, setPickupLocation] = useState("Bashundhara R/A (NSU / IUB Campus)");

  // Images state: array of File objects and preview URLs
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Estimation state
  const [estimation, setEstimation] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [estimationError, setEstimationError] = useState(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdListingId, setCreatedListingId] = useState(null);

  // Validation errors
  const [errors, setErrors] = useState({});

  // -------------------------------------------------------------
  // Real-time Dynamic Depreciation Estimation
  // -------------------------------------------------------------
  const fetchEstimate = useCallback(
    async (cat, origPrice, age, cond) => {
      const priceNum = parseFloat(origPrice);
      const ageNum = parseInt(age, 10);

      if (!cat || isNaN(priceNum) || priceNum <= 0) {
        setEstimation(null);
        return;
      }

      setEstimating(true);
      setEstimationError(null);

      try {
        const res = await fetch("/api/listings/estimate-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: cat,
            originalPrice: priceNum,
            ageInMonths: isNaN(ageNum) || ageNum < 0 ? 0 : ageNum,
            condition: cond,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setEstimation(data);
        } else {
          // If server returned non-200, handle gracefully
          const errData = await res.json().catch(() => ({}));
          setEstimationError(
            errData.message || "Failed to calculate algorithmic fair price estimate."
          );
        }
      } catch (err) {
        console.warn("Error calling /api/listings/estimate-price:", err);
        setEstimationError("Network error while connecting to estimation engine.");
      } finally {
        setEstimating(false);
      }
    },
    []
  );

  // Trigger estimation when pricing inputs change with a slight debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (originalPrice && parseFloat(originalPrice) > 0) {
        fetchEstimate(category, originalPrice, ageInMonths, condition);
      } else {
        setEstimation(null);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [category, originalPrice, ageInMonths, condition, fetchEstimate]);

  // -------------------------------------------------------------
  // Image Upload & Previews
  // -------------------------------------------------------------
  const handleFiles = (incomingFiles) => {
    const fileList = Array.from(incomingFiles);
    const validFiles = [];
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    for (const file of fileList) {
      if (!validMimes.includes(file.type.toLowerCase())) {
        alert(`File "${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 8MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (imageFiles.length + validFiles.length > 5) {
      alert("You can upload a maximum of 5 images per listing.");
      const allowedCount = Math.max(0, 5 - imageFiles.length);
      validFiles.splice(allowedCount);
    }

    if (validFiles.length === 0) return;

    const newFiles = [...imageFiles, ...validFiles];
    setImageFiles(newFiles);

    // Create object URLs for previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Revoke object URL
    try {
      URL.revokeObjectURL(imagePreviews[index]);
    } catch {}

    setImageFiles((prev) => prev.filter((_, idx) => idx !== index));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    };
  }, [imagePreviews]);

  // -------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim() || title.trim().length < 4) {
      newErrors.title = "Title is required and must be at least 4 characters.";
    }

    if (!description.trim() || description.trim().length < 10) {
      newErrors.description = "Please provide a detailed description (at least 10 characters).";
    }

    const origPriceNum = parseFloat(originalPrice);
    if (isNaN(origPriceNum) || origPriceNum <= 0) {
      newErrors.originalPrice = "Original retail price must be greater than ৳0.";
    }

    const askPriceNum = parseFloat(askingPrice);
    if (isNaN(askPriceNum) || askPriceNum <= 0) {
      newErrors.askingPrice = "Current asking price must be greater than ৳0.";
    }

    const ageNum = parseInt(ageInMonths, 10);
    if (isNaN(ageNum) || ageNum < 0) {
      newErrors.ageInMonths = "Age in months cannot be negative.";
    }

    if (autoDropEnabled) {
      const reserveNum = parseFloat(minReservePrice);
      if (isNaN(reserveNum) || reserveNum <= 0) {
        newErrors.minReservePrice = "Minimum reserve price must be greater than ৳0 when Auto-Drop is active.";
      } else if (!isNaN(askPriceNum) && reserveNum >= askPriceNum) {
        newErrors.minReservePrice = "Minimum reserve price must be strictly less than your current asking price.";
      }
    }

    if (!pickupLocation.trim()) {
      newErrors.pickupLocation = "Pickup location is required for campus handover.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      // Scroll to top of form or first error
      window.scrollTo({ top: 200, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("original_price", originalPrice);
      formData.append("originalPrice", originalPrice);
      formData.append("age_in_months", ageInMonths || "0");
      formData.append("ageInMonths", ageInMonths || "0");
      formData.append("item_condition", condition);
      formData.append("condition", condition);
      formData.append("current_asking_price", askingPrice);
      formData.append("asking_price", askingPrice);
      formData.append("askingPrice", askingPrice);
      formData.append("pickup_location", pickupLocation.trim());
      formData.append("pickupLocation", pickupLocation.trim());
      formData.append("is_negotiable", isNegotiable ? "true" : "false");
      formData.append("auto_drop_enabled", autoDropEnabled ? "true" : "false");

      if (autoDropEnabled && minReservePrice) {
        formData.append("min_reserve_price", minReservePrice);
        formData.append("minReservePrice", minReservePrice);
      }

      // Append up to 5 image files
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("/api/listings", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create listing. Please check your inputs.");
      }

      setSubmitSuccess(true);
      setCreatedListingId(data.listing_id || data.listingId || data.id || null);

      // Redirect to home page after brief display
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Listing creation error:", err);
      setSubmitError(err.message || "An unexpected error occurred while publishing your listing.");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Auth Check View
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Checking campus authorization...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] max-w-2xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-teal shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Sign In to Sell on হাতবদল
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
            HaatBodol is a trusted university second-hand marketplace. Please sign in with your verified campus or resident account to list items, activate depreciation estimation, and manage auto-drop auctions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?redirect=/listings/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-teal hover:bg-brand-tealHover text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-lg transition-colors border border-gray-300"
            >
              <span>Create Account</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Instant Demo Access:</span> Use{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">tanvir@northsouth.edu</code> /{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">Password123!</code> on the login page.
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Success View Banner
  // -------------------------------------------------------------
  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Listing Published Successfully!
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            Your item <span className="font-semibold text-gray-900">&ldquo;{title}&rdquo;</span> is now live in the HaatBodol marketplace for campus buyers.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Redirecting to marketplace catalog in a moment...</span>
          </div>

          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 bg-brand-teal hover:bg-brand-tealHover text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate structured negotiation range preview
  const askingNum = parseFloat(askingPrice) || 0;
  const negMinOffer = Math.round(askingNum * 0.7);
  const negMaxOffer = Math.round(askingNum * 0.85);

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-teal transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href="/listings" className="hover:text-brand-teal transition-colors">
            Listings
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-800 font-semibold">Create New Listing</span>
        </nav>

        {/* Page Title & Seller Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Seller Hub
              </span>
              <span className="text-xs text-gray-500">
                Campus Marketplace Handover
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              List an Item for Resale
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Reach verified campus buyers with algorithm-backed fair pricing and structured negotiations.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:self-center">
            <div className="w-9 h-9 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center font-bold text-brand-teal text-sm">
              {(user.full_name || "U")[0].toUpperCase()}
            </div>
            <div className="text-xs">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <span>{user.full_name}</span>
                {user.is_campus_verified ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-teal bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                ) : null}
              </div>
              <div className="text-gray-500 text-[11px]">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Global Submission Error Banner */}
        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Unable to publish listing</p>
              <p className="text-xs mt-0.5 text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* -------------------------------------------------------------
              SECTION 1: ITEM OVERVIEW & CATEGORY
              ------------------------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-brand-teal">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">1. Item Overview</h3>
                <p className="text-xs text-gray-500">Provide title, category, and an honest description.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`text-left p-3 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? "border-brand-teal bg-teal-50/70 shadow-sm ring-1 ring-brand-teal text-teal-950 font-semibold"
                            : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <div className="font-bold text-sm mb-0.5 flex items-center justify-between">
                          <span>{cat.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-teal" />}
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-snug">
                          {cat.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label htmlFor="listing-title" className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Listing Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="listing-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., MacBook Pro M1 13-inch 16GB RAM 512GB SSD with Charger"
                  maxLength={150}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal ${
                    errors.title ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"
                  }`}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.title}</span>
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  Include brand, model, and primary specifications to attract campus buyers.
                </p>
              </div>

              {/* Description Input */}
              <div>
                <label htmlFor="listing-description" className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="listing-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item's history, reasons for selling, working condition, accessories included, and any cosmetic scratches..."
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal ${
                    errors.description ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"
                  }`}
                />
                {errors.description && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              SECTION 2: CONDITION & ITEM AGE
              ------------------------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-brand-teal">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">2. Physical Condition & Age</h3>
                <p className="text-xs text-gray-500">
                  Accurate condition ratings power our Strategy pattern depreciation algorithm.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Condition Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Item Condition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {CONDITIONS.map((cond) => {
                    const isSelected = condition === cond.id;
                    return (
                      <button
                        type="button"
                        key={cond.id}
                        onClick={() => setCondition(cond.id)}
                        className={`text-left p-3 rounded-lg border text-xs transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-brand-teal bg-teal-50/70 shadow-sm ring-1 ring-brand-teal"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-900 text-sm">{cond.label}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-teal" />}
                          </div>
                          <p className="text-[11px] text-gray-500 leading-snug">{cond.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Age in Months */}
              <div className="max-w-xs">
                <label htmlFor="listing-age" className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Age in Months <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    id="listing-age"
                    type="number"
                    min="0"
                    max="120"
                    step="1"
                    value={ageInMonths}
                    onChange={(e) => setAgeInMonths(e.target.value)}
                    placeholder="e.g., 6"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal pr-16 ${
                      errors.ageInMonths ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400 font-semibold">
                    months
                  </div>
                </div>
                {errors.ageInMonths && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.ageInMonths}</span>
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  How many months ago was this item purchased new from retail?
                </p>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              SECTION 3: SMART PRICING & STRATEGY DEPRECIATION
              ------------------------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-brand-teal">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">3. Pricing & Market Valuation</h3>
                <p className="text-xs text-gray-500">
                  Input retail price to trigger real-time fair market valuation.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original Retail Price */}
                <div>
                  <label htmlFor="listing-orig-price" className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                    Original Retail Price (BDT ৳) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                      ৳
                    </div>
                    <input
                      id="listing-orig-price"
                      type="number"
                      min="1"
                      step="1"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="e.g., 45000"
                      className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal ${
                        errors.originalPrice ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"
                      }`}
                    />
                  </div>
                  {errors.originalPrice && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.originalPrice}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">
                    The brand new purchase price from retail or authorized store.
                  </p>
                </div>

                {/* Current Asking Price */}
                <div>
                  <label htmlFor="listing-asking-price" className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                    Current Asking Price (BDT ৳) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                      ৳
                    </div>
                    <input
                      id="listing-asking-price"
                      type="number"
                      min="1"
                      step="1"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      placeholder="e.g., 28000"
                      className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm text-gray-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-teal ${
                        errors.askingPrice ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"
                      }`}
                    />
                  </div>
                  {errors.askingPrice && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.askingPrice}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">
                    Your initial listing price displayed to campus buyers.
                  </p>
                </div>
              </div>

              {/* Real-Time Depreciation Estimator Box */}
              <div>
                <DepreciationBox
                  estimation={estimation}
                  loading={estimating}
                  error={estimationError}
                  currentPrice={askingPrice}
                  onApplyPrice={(val) => {
                    setAskingPrice(String(Math.round(val)));
                    // Clear askingPrice validation error if set
                    if (errors.askingPrice) {
                      setErrors((prev) => ({ ...prev, askingPrice: null }));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              SECTION 4: DYNAMIC SELLING MECHANISMS (NEGOTIATION & AUTO-DROP)
              ------------------------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-brand-teal">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">4. Dynamic Campus Selling Features</h3>
                <p className="text-xs text-gray-500">
                  Control structured buyer counter-offers and automatic price reductions.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Feature A: Structured Negotiation Toggle */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">
                        Allow Structured Price Negotiations
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                        70% – 85% Rule
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Verified buyers can submit binding counter-offers strictly constrained within{" "}
                      <strong>70% to 85%</strong> of your current asking price. Unreasonable low-ball
                      bids below 70% are automatically rejected by HaatBodol to save your time.
                    </p>

                    {isNegotiable && askingNum > 0 && (
                      <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
                        <span>
                          Buyers can offer between:{" "}
                          <strong className="text-brand-teal font-mono">
                            ৳{negMinOffer.toLocaleString()}
                          </strong>{" "}
                          –{" "}
                          <strong className="text-brand-teal font-mono">
                            ৳{negMaxOffer.toLocaleString()}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal"></div>
                  </label>
                </div>
              </div>

              {/* Feature B: Auto-Drop Dutch Auction Toggle */}
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-amber" />
                      <span className="font-bold text-sm text-gray-900">
                        Enable 7-Day Auto-Drop Dutch Auction
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-brand-amber text-white shadow-2xs">
                        -5% Weekly
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Our system automatically drops your listing price by <strong>5% every 7 days</strong>{" "}
                      until a buyer purchases the item or the price reaches your Minimum Reserve Price floor.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={autoDropEnabled}
                      onChange={(e) => setAutoDropEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-amber"></div>
                  </label>
                </div>

                {/* Conditional Reserve Price Input */}
                {autoDropEnabled && (
                  <div className="mt-4 pt-4 border-t border-amber-200/80">
                    <label htmlFor="listing-reserve-price" className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                      Minimum Reserve Price Floor (BDT ৳) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative max-w-xs rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                        ৳
                      </div>
                      <input
                        id="listing-reserve-price"
                        type="number"
                        min="1"
                        step="1"
                        value={minReservePrice}
                        onChange={(e) => setMinReservePrice(e.target.value)}
                        placeholder="e.g., 20000"
                        className={`w-full pl-8 pr-3.5 py-2 rounded-lg border text-sm text-gray-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-amber ${
                          errors.minReservePrice ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"
                        }`}
                      />
                    </div>
                    {errors.minReservePrice ? (
                      <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.minReservePrice}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500 mt-1.5">
                        The lowest price you are willing to accept. The automatic drops will stop once this floor is reached.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              SECTION 5: PICKUP LOCATION & HANDOVER
              ------------------------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-brand-teal">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">5. Pickup Location & Handover</h3>
                <p className="text-xs text-gray-500">
                  Specify campus or residential area for convenient in-person handover.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="listing-location" className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Campus / Residential Location <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="listing-location"
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g., Bashundhara R/A (NSU Gate 1 / IUB Campus)"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal ${
                      errors.pickupLocation ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"
                    }`}
                  />
                </div>
                {errors.pickupLocation && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.pickupLocation}</span>
                  </p>
                )}
              </div>

              {/* Quick suggestion pills */}
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Suggested Campus Areas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CAMPUS_SUGGESTIONS.map((campus) => (
                    <button
                      type="button"
                      key={campus}
                      onClick={() => setPickupLocation(campus)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        pickupLocation === campus
                          ? "bg-teal-50 border-brand-teal text-brand-teal font-semibold"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {campus}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              SECTION 6: PHOTO UPLOADS (MAX 5)
              ------------------------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-brand-teal">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  6. Photos (Up to 5 Images)
                </h3>
                <p className="text-xs text-gray-500">
                  Upload crisp real photographs. First photo will be displayed as the Primary Cover Image.
                </p>
              </div>
            </div>

            {/* Drag & Drop Upload Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-brand-teal bg-teal-50/50 scale-[1.005]"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files);
                  }
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-2xs flex items-center justify-center mx-auto mb-3 text-brand-teal">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">
                Drag and drop your photos here, or <span className="text-brand-teal underline">Browse files</span>
              </p>
              <p className="text-xs text-gray-500">
                Supports JPEG, PNG, or WebP up to 8MB each. Up to 5 photos.
              </p>
            </div>

            {/* Image Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>Selected Photos ({imagePreviews.length} / 5)</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    Primary photo appears on marketplace cards
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {imagePreviews.map((src, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-square shadow-2xs"
                    >
                      <img
                        src={src}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Primary Cover Badge */}
                      {index === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                          Cover Photo
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md transition-transform hover:scale-110"
                        title="Remove image"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        #{index + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add more placeholder button */}
                  {imagePreviews.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 flex flex-col items-center justify-center aspect-square text-gray-400 hover:text-gray-600 transition-colors"
                      title="Add more photos"
                    >
                      <Plus className="w-6 h-6 mb-1" />
                      <span className="text-[11px] font-semibold">Add Photo</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------
              SUBMIT & PUBLISH BAR
              ------------------------------------------------------------- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              By listing your item on <span className="font-semibold text-gray-800">হাতবদল</span>, you agree to fair campus trading ethics and accurate condition representation.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/"
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors text-center"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-teal hover:bg-brand-tealHover text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Listing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Listing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
