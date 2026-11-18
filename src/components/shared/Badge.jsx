"use client";

import React from "react";
import { ShieldCheck, Clock, Flame, Tag, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Reusable Badge component for conditions, statuses, deals, and campus verification.
 * 100% English interface text only.
 */
export default function Badge({
  children,
  variant = "default",
  size = "sm",
  icon = true,
  className = "",
}) {
  const text = (children || "").toString().trim();
  const lower = text.toLowerCase();

  // Size styles
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 font-medium rounded",
    sm: "text-xs px-2.5 py-0.5 font-semibold rounded-full",
    md: "text-sm px-3 py-1 font-semibold rounded-full",
  }[size] || "text-xs px-2.5 py-0.5 font-semibold rounded-full";

  // Determine badge styling and icon based on content or explicit variant
  let styleClasses = "bg-gray-100 text-gray-800 border border-gray-200";
  let IconComponent = null;

  if (variant === "campus-verified" || lower.includes("campus verified") || lower.includes("verified")) {
    styleClasses = "bg-teal-50 text-brand-teal border border-teal-200 font-semibold";
    IconComponent = ShieldCheck;
  } else if (variant === "autodrop" || lower.includes("-5%") || lower.includes("auto-drop") || lower.includes("drop soon")) {
    styleClasses = "bg-brand-amber text-white shadow-sm font-bold border border-amber-600";
    IconComponent = Clock;
  } else if (variant === "deal" || lower.includes("deal") || lower.includes("discount")) {
    styleClasses = "bg-amber-100 text-amber-900 border border-amber-300 font-semibold";
    IconComponent = Flame;
  } else if (lower === "like new") {
    styleClasses = "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium";
    IconComponent = CheckCircle2;
  } else if (lower === "good") {
    styleClasses = "bg-sky-50 text-sky-700 border border-sky-200 font-medium";
  } else if (lower === "fair") {
    styleClasses = "bg-amber-50 text-amber-800 border border-amber-200 font-medium";
  } else if (lower === "needs repair") {
    styleClasses = "bg-orange-50 text-orange-800 border border-orange-200 font-medium";
    IconComponent = AlertCircle;
  } else if (lower === "available") {
    styleClasses = "bg-emerald-100 text-emerald-800 border border-emerald-300";
  } else if (lower === "reserved") {
    styleClasses = "bg-amber-100 text-amber-800 border border-amber-300";
  } else if (lower === "sold") {
    styleClasses = "bg-rose-100 text-rose-800 border border-rose-300";
  } else if (lower === "hidden") {
    styleClasses = "bg-gray-200 text-gray-700 border border-gray-300";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 leading-none tracking-wide transition-colors ${sizeClasses} ${styleClasses} ${className}`}
    >
      {icon && IconComponent && (
        <IconComponent
          className={size === "xs" ? "w-2.5 h-2.5 flex-shrink-0" : "w-3.5 h-3.5 flex-shrink-0"}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
