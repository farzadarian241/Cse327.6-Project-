package com.haatbodol.patterns.decorator;

import com.haatbodol.model.ListingDto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * <h2>Pattern 8: Decorator Pattern — {@code BaseListingComponent}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteComponent} — wraps a raw
 * {@link ListingDto}, normalizes missing/nullable fields, guarantees a valid
 * photographic category fallback image, and initializes the empty
 * {@code decorators} map that concrete decorators progressively enrich.</p>
 */
public class BaseListingComponent implements ListingPresentationComponent {

    private static final String DEFAULT_ELECTRONICS_IMAGE = "/uploads/defaults/laptop.jpg";
    private static final String DEFAULT_FURNITURE_IMAGE = "/uploads/defaults/study-desk.jpg";
    private static final String DEFAULT_CLOTHING_IMAGE = "/uploads/defaults/winter-jacket.jpg";

    private final ListingDto baseListing;
    private final Map<String, Object> decorators;

    /**
     * Wraps and normalizes the supplied {@link ListingDto} without mutating the caller's instance.
     *
     * @param listing raw listing DTO (may be {@code null}, in which case safe defaults are used)
     */
    public BaseListingComponent(ListingDto listing) {
        this.baseListing = normalizeListing(listing);
        this.decorators = createEmptyDecoratorsMap();
    }

    private ListingDto normalizeListing(ListingDto raw) {
        ListingDto normalized = new ListingDto(raw);

        normalized.setTitle(hasText(normalized.getTitle()) ? normalized.getTitle().trim() : "Untitled Listing");
        normalized.setDescription(normalized.getDescription() != null ? normalized.getDescription() : "");
        normalized.setCategory(hasText(normalized.getCategory()) ? normalized.getCategory().trim() : "General");

        normalized.setOriginalPrice(normalized.getOriginalPrice() != null ? normalized.getOriginalPrice() : 0.0);
        normalized.setCurrentAskingPrice(normalized.getCurrentAskingPrice() != null ? normalized.getCurrentAskingPrice() : 0.0);
        normalized.setAgeInMonths(normalized.getAgeInMonths() != null ? Math.max(0, normalized.getAgeInMonths()) : 0);

        normalized.setItemCondition(hasText(normalized.getItemCondition()) ? normalized.getItemCondition().trim() : "Good");
        normalized.setListingStatus(hasText(normalized.getListingStatus()) ? normalized.getListingStatus().trim() : "AVAILABLE");
        normalized.setPickupLocation(hasText(normalized.getPickupLocation()) ? normalized.getPickupLocation().trim() : "Campus Meetup");
        normalized.setIsNegotiable(Boolean.TRUE.equals(normalized.getIsNegotiable()));

        normalized.setAutoDropEnabled(Boolean.TRUE.equals(normalized.getAutoDropEnabled()));
        normalized.setDropPercentage(normalized.getDropPercentage() != null && normalized.getDropPercentage() > 0
                ? normalized.getDropPercentage()
                : 5.0);
        normalized.setIsHalted(Boolean.TRUE.equals(normalized.getIsHalted()));

        normalized.setSellerName(hasText(normalized.getSellerName()) ? normalized.getSellerName().trim() : "Campus Student");
        normalized.setSellerRating(normalized.getSellerRating() != null ? normalized.getSellerRating() : 5.0);
        normalized.setSellerReviews(normalized.getSellerReviews() != null ? normalized.getSellerReviews() : 0);
        normalized.setCampusArea(normalized.getCampusArea() != null ? normalized.getCampusArea() : "");
        normalized.setIsCampusVerified(Boolean.TRUE.equals(normalized.getIsCampusVerified()));

        List<String> normalizedImages = normalized.getImages() != null
                ? new ArrayList<>(normalized.getImages())
                : new ArrayList<>();
        normalized.setImages(normalizedImages);
        normalized.setImageUrl(resolveImageUrl(normalized.getImageUrl(), normalizedImages, normalized.getCategory()));

        return normalized;
    }

    /**
     * Resolves a valid photographic image URL, falling back to the first item in
     * {@code images} and finally to a category-specific photographic default.
     */
    private String resolveImageUrl(String imageUrl, List<String> images, String category) {
        if (hasText(imageUrl)) {
            return imageUrl.trim();
        }
        if (images != null) {
            for (String candidate : images) {
                if (hasText(candidate)) {
                    return candidate.trim();
                }
            }
        }

        String cat = category != null ? category.toLowerCase(Locale.ROOT) : "";
        if (cat.contains("furnit") || cat.contains("desk") || cat.contains("chair") || cat.contains("table")) {
            return DEFAULT_FURNITURE_IMAGE;
        }
        if (cat.contains("cloth") || cat.contains("jacket") || cat.contains("wear") || cat.contains("shoe")) {
            return DEFAULT_CLOTHING_IMAGE;
        }
        return DEFAULT_ELECTRONICS_IMAGE;
    }

    private static Map<String, Object> createEmptyDecoratorsMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("savingsBadge", null);
        map.put("autoDropBadge", null);
        map.put("campusVerifiedBadge", null);
        map.put("pricingMeta", null);
        map.put("auctionMeta", null);
        return map;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    @Override
    public ListingDto getBaseListing() {
        return baseListing;
    }

    @Override
    public Map<String, Object> getDecorators() {
        return new LinkedHashMap<>(decorators);
    }

    @Override
    public Map<String, Object> toPresentationMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("listing_id", baseListing.getListingId());
        map.put("seller_id", baseListing.getSellerId());
        map.put("title", baseListing.getTitle());
        map.put("description", baseListing.getDescription());
        map.put("category", baseListing.getCategory());
        map.put("original_price", baseListing.getOriginalPrice());
        map.put("age_in_months", baseListing.getAgeInMonths());
        map.put("item_condition", baseListing.getItemCondition());
        map.put("suggested_min_price", baseListing.getSuggestedMinPrice());
        map.put("suggested_max_price", baseListing.getSuggestedMaxPrice());
        map.put("current_asking_price", baseListing.getCurrentAskingPrice());
        map.put("pickup_location", baseListing.getPickupLocation());
        map.put("listing_status", baseListing.getListingStatus());
        map.put("is_negotiable", baseListing.getIsNegotiable());
        map.put("auto_drop_enabled", baseListing.getAutoDropEnabled());
        map.put("published_at", baseListing.getPublishedAt());
        map.put("updated_at", baseListing.getUpdatedAt());
        map.put("seller_name", baseListing.getSellerName());
        map.put("is_campus_verified", baseListing.getIsCampusVerified());
        map.put("seller_rating", baseListing.getSellerRating());
        map.put("seller_reviews", baseListing.getSellerReviews());
        map.put("campus_area", baseListing.getCampusArea());
        map.put("seller_campus_area", baseListing.getCampusArea());
        map.put("image_url", baseListing.getImageUrl());
        map.put("images", new ArrayList<>(baseListing.getImages()));
        map.put("next_drop_at", baseListing.getNextDropAt());
        map.put("min_reserve_price", baseListing.getMinReservePrice());
        map.put("drop_percentage", baseListing.getDropPercentage());
        map.put("is_halted", baseListing.getIsHalted());
        map.put("decorators", getDecorators());
        return map;
    }
}
