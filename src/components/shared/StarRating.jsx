"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

/**
 * Reusable StarRating component.
 * Displays 1 to 5 stars with numeric score and optional review count.
 * Supports interactive hover & click rating selection when interactive=true.
 */
export default function StarRating({
  rating = 0,
  totalReviews = null,
  showScore = true,
  showCount = true,
  size = "sm",
  interactive = false,
  onChange = null,
  className = "",
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  }[size] || "w-3.5 h-3.5";

  const textSizes = {
    xs: "text-[11px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size] || "text-xs";

  const effectiveRating = interactive && hoverRating > 0 ? hoverRating : Number(rating) || 0;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = starIndex <= Math.round(effectiveRating);
          return (
            <button
              key={starIndex}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starIndex)}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? "cursor-pointer transform hover:scale-110 transition-transform p-0.5 focus:outline-none"
                  : "cursor-default"
              }`}
              aria-label={`${starIndex} star`}
            >
              <Star
                className={`${starSizes} transition-colors ${
                  filled
                    ? "fill-amber-500 text-amber-500"
                    : "fill-gray-200 text-gray-300"
                }`}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className={`font-bold tabular-nums text-gray-900 ${textSizes}`}>
          {Number(effectiveRating).toFixed(1)}
        </span>
      )}

      {showCount && totalReviews !== null && totalReviews !== undefined && (
        <span className={`text-gray-500 ${textSizes}`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
}
