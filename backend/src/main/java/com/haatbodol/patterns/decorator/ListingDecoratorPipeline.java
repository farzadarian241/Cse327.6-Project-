package com.haatbodol.patterns.decorator;

import com.haatbodol.model.ListingDto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * <h2>Pattern 8: Decorator Pattern — {@code ListingDecoratorPipeline}</h2>
 *
 * <p>Pipeline utility that composes the full HaatBodol presentation decorator chain
 * around any {@link ListingDto}:</p>
 *
 * <pre>{@code
 * new CampusVerifiedDecorator(
 *     new AutoDropCountdownDecorator(
 *         new SavingsBadgeDecorator(
 *             new BaseListingComponent(dto)
 *         )
 *     )
 * )
 * }</pre>
 */
public final class ListingDecoratorPipeline {

    private ListingDecoratorPipeline() {
        // Utility class
    }

    /**
     * Wraps a single {@link ListingDto} through the complete decorator chain and
     * returns the enriched presentation map.
     *
     * @param dto listing DTO to decorate
     * @return enriched presentation map, or {@code null} if {@code dto} is {@code null}
     */
    public static Map<String, Object> decorate(ListingDto dto) {
        if (dto == null) {
            return null;
        }
        ListingPresentationComponent decorated = new CampusVerifiedDecorator(
                new AutoDropCountdownDecorator(
                        new SavingsBadgeDecorator(
                                new BaseListingComponent(dto)
                        )
                )
        );
        return decorated.toPresentationMap();
    }

    /**
     * Decorates a list of {@link ListingDto} objects, skipping any {@code null} entries.
     *
     * @param dtos list of listing DTOs
     * @return list of enriched presentation maps (never {@code null})
     */
    public static List<Map<String, Object>> decorateAll(List<ListingDto> dtos) {
        List<Map<String, Object>> results = new ArrayList<>();
        if (dtos == null || dtos.isEmpty()) {
            return results;
        }
        for (ListingDto dto : dtos) {
            if (dto != null) {
                results.add(decorate(dto));
            }
        }
        return results;
    }
}
