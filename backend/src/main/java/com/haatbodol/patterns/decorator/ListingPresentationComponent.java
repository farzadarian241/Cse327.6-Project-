package com.haatbodol.patterns.decorator;

import com.haatbodol.model.ListingDto;

import java.util.Map;

/**
 * <h2>Pattern 8: Decorator Pattern — {@code ListingPresentationComponent}</h2>
 *
 * <p><strong>GoF Classification:</strong> Structural Pattern (Decorator)</p>
 * <p><strong>GoF Participant:</strong> {@code Component} (Interface) — defines the
 * uniform contract implemented by both the concrete listing component
 * ({@link BaseListingComponent}) and every presentation decorator
 * ({@link ListingPresentationDecorator} and its subclasses).</p>
 *
 * <p>Enables stacking presentation badges, countdown timers, and pricing metadata
 * dynamically at runtime without modifying the underlying database entity or DTO.</p>
 */
public interface ListingPresentationComponent {

    /**
     * Serializes the listing and all stacked decorator payloads into a JSON-ready
     * presentation map preserving the snake_case listing fields and the nested
     * {@code decorators} object.
     *
     * @return enriched presentation map ready for REST serialization
     */
    Map<String, Object> toPresentationMap();

    /**
     * Returns the normalized base {@link ListingDto} wrapped by this component chain.
     *
     * @return normalized base listing DTO
     */
    ListingDto getBaseListing();

    /**
     * Returns the accumulated {@code decorators} map containing badge and metadata
     * entries ({@code savingsBadge}, {@code autoDropBadge}, {@code campusVerifiedBadge},
     * {@code pricingMeta}, {@code auctionMeta}).
     *
     * @return map of presentation decorator payloads
     */
    Map<String, Object> getDecorators();
}
