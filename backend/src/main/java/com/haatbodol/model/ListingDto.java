package com.haatbodol.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/**
 * Shared Listing Data Transfer Object (DTO) matching the exact snake_case JSON
 * contract consumed by the Next.js frontend ({@code ProductCard.jsx}, {@code page.jsx})
 * and enriched by the Decorator Pattern pipeline ({@code com.haatbodol.patterns.decorator}).
 */
public class ListingDto {

    @JsonProperty("listing_id")
    private Long listingId;

    @JsonProperty("seller_id")
    private Long sellerId;

    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("category")
    private String category;

    @JsonProperty("original_price")
    private Double originalPrice;

    @JsonProperty("age_in_months")
    private Integer ageInMonths;

    @JsonProperty("item_condition")
    private String itemCondition;

    @JsonProperty("suggested_min_price")
    private Double suggestedMinPrice;

    @JsonProperty("suggested_max_price")
    private Double suggestedMaxPrice;

    @JsonProperty("current_asking_price")
    private Double currentAskingPrice;

    @JsonProperty("pickup_location")
    private String pickupLocation;

    @JsonProperty("listing_status")
    private String listingStatus;

    @JsonProperty("is_negotiable")
    private Boolean isNegotiable;

    @JsonProperty("auto_drop_enabled")
    private Boolean autoDropEnabled;

    @JsonProperty("published_at")
    private String publishedAt;

    @JsonProperty("updated_at")
    private String updatedAt;

    @JsonProperty("seller_name")
    private String sellerName;

    @JsonProperty("is_campus_verified")
    private Boolean isCampusVerified;

    @JsonProperty("seller_rating")
    private Double sellerRating;

    @JsonProperty("seller_reviews")
    private Integer sellerReviews;

    @JsonProperty("campus_area")
    private String campusArea;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("images")
    private List<String> images = new ArrayList<>();

    @JsonProperty("next_drop_at")
    private String nextDropAt;

    @JsonProperty("min_reserve_price")
    private Double minReservePrice;

    @JsonProperty("drop_percentage")
    private Double dropPercentage;

    @JsonProperty("is_halted")
    private Boolean isHalted;

    public ListingDto() {
    }

    /**
     * Defensive copy constructor used by Decorator components so presentation
     * normalization never mutates the caller's underlying DTO instance.
     *
     * @param source the source listing DTO to copy
     */
    public ListingDto(ListingDto source) {
        if (source == null) {
            return;
        }
        this.listingId = source.listingId;
        this.sellerId = source.sellerId;
        this.title = source.title;
        this.description = source.description;
        this.category = source.category;
        this.originalPrice = source.originalPrice;
        this.ageInMonths = source.ageInMonths;
        this.itemCondition = source.itemCondition;
        this.suggestedMinPrice = source.suggestedMinPrice;
        this.suggestedMaxPrice = source.suggestedMaxPrice;
        this.currentAskingPrice = source.currentAskingPrice;
        this.pickupLocation = source.pickupLocation;
        this.listingStatus = source.listingStatus;
        this.isNegotiable = source.isNegotiable;
        this.autoDropEnabled = source.autoDropEnabled;
        this.publishedAt = source.publishedAt;
        this.updatedAt = source.updatedAt;
        this.sellerName = source.sellerName;
        this.isCampusVerified = source.isCampusVerified;
        this.sellerRating = source.sellerRating;
        this.sellerReviews = source.sellerReviews;
        this.campusArea = source.campusArea;
        this.imageUrl = source.imageUrl;
        this.images = source.images != null ? new ArrayList<>(source.images) : new ArrayList<>();
        this.nextDropAt = source.nextDropAt;
        this.minReservePrice = source.minReservePrice;
        this.dropPercentage = source.dropPercentage;
        this.isHalted = source.isHalted;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(Double originalPrice) {
        this.originalPrice = originalPrice;
    }

    public Integer getAgeInMonths() {
        return ageInMonths;
    }

    public void setAgeInMonths(Integer ageInMonths) {
        this.ageInMonths = ageInMonths;
    }

    public String getItemCondition() {
        return itemCondition;
    }

    public void setItemCondition(String itemCondition) {
        this.itemCondition = itemCondition;
    }

    public Double getSuggestedMinPrice() {
        return suggestedMinPrice;
    }

    public void setSuggestedMinPrice(Double suggestedMinPrice) {
        this.suggestedMinPrice = suggestedMinPrice;
    }

    public Double getSuggestedMaxPrice() {
        return suggestedMaxPrice;
    }

    public void setSuggestedMaxPrice(Double suggestedMaxPrice) {
        this.suggestedMaxPrice = suggestedMaxPrice;
    }

    public Double getCurrentAskingPrice() {
        return currentAskingPrice;
    }

    public void setCurrentAskingPrice(Double currentAskingPrice) {
        this.currentAskingPrice = currentAskingPrice;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getListingStatus() {
        return listingStatus;
    }

    public void setListingStatus(String listingStatus) {
        this.listingStatus = listingStatus;
    }

    public Boolean getIsNegotiable() {
        return isNegotiable;
    }

    public void setIsNegotiable(Boolean isNegotiable) {
        this.isNegotiable = isNegotiable;
    }

    public Boolean getAutoDropEnabled() {
        return autoDropEnabled;
    }

    public void setAutoDropEnabled(Boolean autoDropEnabled) {
        this.autoDropEnabled = autoDropEnabled;
    }

    public String getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(String publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public Boolean getIsCampusVerified() {
        return isCampusVerified;
    }

    public void setIsCampusVerified(Boolean isCampusVerified) {
        this.isCampusVerified = isCampusVerified;
    }

    public Double getSellerRating() {
        return sellerRating;
    }

    public void setSellerRating(Double sellerRating) {
        this.sellerRating = sellerRating;
    }

    public Integer getSellerReviews() {
        return sellerReviews;
    }

    public void setSellerReviews(Integer sellerReviews) {
        this.sellerReviews = sellerReviews;
    }

    public String getCampusArea() {
        return campusArea;
    }

    public void setCampusArea(String campusArea) {
        this.campusArea = campusArea;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images != null ? images : new ArrayList<>();
    }

    public String getNextDropAt() {
        return nextDropAt;
    }

    public void setNextDropAt(String nextDropAt) {
        this.nextDropAt = nextDropAt;
    }

    public Double getMinReservePrice() {
        return minReservePrice;
    }

    public void setMinReservePrice(Double minReservePrice) {
        this.minReservePrice = minReservePrice;
    }

    public Double getDropPercentage() {
        return dropPercentage;
    }

    public void setDropPercentage(Double dropPercentage) {
        this.dropPercentage = dropPercentage;
    }

    public Boolean getIsHalted() {
        return isHalted;
    }

    public void setIsHalted(Boolean isHalted) {
        this.isHalted = isHalted;
    }
}
