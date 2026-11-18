package com.haatbodol.patterns.builder;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * <h2>Pattern 6: Builder Pattern — {@code ListingQueryBuilder}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteBuilder} — constructs parameterized
 * MySQL {@code COUNT} and {@code SELECT} queries for HaatBodol marketplace listings.</p>
 *
 * <p><strong>Security Guarantee:</strong> Every user-supplied value is bound exclusively via
 * JDBC {@code ?} placeholders in {@link BuiltSqlQuery}. Sorting uses a strict allowlist
 * switch so untrusted input can never be concatenated into SQL clauses.</p>
 */
public class ListingQueryBuilder implements SqlQueryBuilder {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_LIMIT = 24;
    public static final int MAX_LIMIT = 100;

    private static final String SELECT_COLUMNS = """
            SELECT
                p.listing_id,
                p.seller_id,
                p.title,
                p.description,
                p.category,
                CAST(p.original_price AS DOUBLE) AS original_price,
                p.age_in_months,
                p.item_condition,
                CAST(p.suggested_min_price AS DOUBLE) AS suggested_min_price,
                CAST(p.suggested_max_price AS DOUBLE) AS suggested_max_price,
                CAST(p.current_asking_price AS DOUBLE) AS current_asking_price,
                p.pickup_location,
                p.listing_status,
                p.is_negotiable,
                p.auto_drop_enabled,
                p.published_at,
                p.updated_at,
                u.full_name AS seller_name,
                CAST(u.average_rating AS DOUBLE) AS seller_rating,
                u.total_reviews AS seller_reviews,
                u.campus_area AS seller_campus_area,
                u.is_campus_verified,
                img.image_url,
                CAST(adc.min_reserve_price AS DOUBLE) AS min_reserve_price,
                CAST(adc.drop_percentage AS DOUBLE) AS drop_percentage,
                adc.next_drop_at,
                adc.is_halted
            FROM product_listings p
            INNER JOIN users u ON p.seller_id = u.user_id
            LEFT JOIN listing_images img ON p.listing_id = img.listing_id AND img.display_order = 1
            LEFT JOIN auto_drop_configs adc ON p.listing_id = adc.listing_id AND adc.is_halted = 0
            """;

    private static final String COUNT_FROM_CLAUSE = """
            SELECT COUNT(*) AS total
            FROM product_listings p
            INNER JOIN users u ON p.seller_id = u.user_id
            LEFT JOIN auto_drop_configs adc ON p.listing_id = adc.listing_id AND adc.is_halted = 0
            """;

    private String keyword;
    private String category;
    private Double minPrice;
    private Double maxPrice;
    private String condition;
    private String location;
    private Boolean autoDropOnly;
    private Boolean verifiedOnly;
    private String sort = "newest";
    private int page = DEFAULT_PAGE;
    private int limit = DEFAULT_LIMIT;

    @Override
    public ListingQueryBuilder withKeyword(String keyword) {
        this.keyword = normalizeFilterText(keyword);
        return this;
    }

    @Override
    public ListingQueryBuilder withCategory(String category) {
        String clean = normalizeFilterText(category);
        if (clean != null && !"all".equalsIgnoreCase(clean)) {
            this.category = clean;
        } else {
            this.category = null;
        }
        return this;
    }

    @Override
    public ListingQueryBuilder withMinPrice(Double minPrice) {
        if (minPrice != null && !minPrice.isNaN() && !minPrice.isInfinite() && minPrice >= 0.0) {
            this.minPrice = minPrice;
        } else {
            this.minPrice = null;
        }
        return this;
    }

    @Override
    public ListingQueryBuilder withMaxPrice(Double maxPrice) {
        if (maxPrice != null && !maxPrice.isNaN() && !maxPrice.isInfinite() && maxPrice >= 0.0) {
            this.maxPrice = maxPrice;
        } else {
            this.maxPrice = null;
        }
        return this;
    }

    @Override
    public ListingQueryBuilder withCondition(String condition) {
        String clean = normalizeFilterText(condition);
        if (clean != null && !"all".equalsIgnoreCase(clean)) {
            this.condition = clean;
        } else {
            this.condition = null;
        }
        return this;
    }

    @Override
    public ListingQueryBuilder withLocation(String location) {
        String clean = normalizeFilterText(location);
        if (clean != null && !"all".equalsIgnoreCase(clean)) {
            this.location = clean;
        } else {
            this.location = null;
        }
        return this;
    }

    @Override
    public ListingQueryBuilder withAutoDropOnly(Boolean autoDropOnly) {
        this.autoDropOnly = Boolean.TRUE.equals(autoDropOnly);
        return this;
    }

    @Override
    public ListingQueryBuilder withVerifiedOnly(Boolean verifiedOnly) {
        this.verifiedOnly = Boolean.TRUE.equals(verifiedOnly);
        return this;
    }

    @Override
    public ListingQueryBuilder withSort(String sort) {
        String clean = normalizeFilterText(sort);
        this.sort = clean != null ? clean.toLowerCase(Locale.ROOT) : "newest";
        return this;
    }

    @Override
    public ListingQueryBuilder withPage(Integer page) {
        if (page != null && page >= 1) {
            this.page = page;
        } else {
            this.page = DEFAULT_PAGE;
        }
        return this;
    }

    @Override
    public ListingQueryBuilder withLimit(Integer limit) {
        if (limit != null) {
            this.limit = Math.max(1, Math.min(MAX_LIMIT, limit));
        } else {
            this.limit = DEFAULT_LIMIT;
        }
        return this;
    }

    @Override
    public BuiltSqlQuery build() {
        List<String> predicates = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        // Always filter public marketplace results to AVAILABLE items
        predicates.add("p.listing_status = 'AVAILABLE'");

        if (keyword != null) {
            String likePattern = "%" + keyword + "%";
            predicates.add("(LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?) OR LOWER(p.pickup_location) LIKE LOWER(?))");
            params.add(likePattern);
            params.add(likePattern);
            params.add(likePattern);
        }

        if (category != null) {
            predicates.add("p.category = ?");
            params.add(category);
        }

        if (minPrice != null) {
            predicates.add("p.current_asking_price >= ?");
            params.add(minPrice);
        }

        if (maxPrice != null) {
            predicates.add("p.current_asking_price <= ?");
            params.add(maxPrice);
        }

        if (condition != null) {
            predicates.add("p.item_condition = ?");
            params.add(condition);
        }

        if (location != null) {
            String locationPattern = "%" + location + "%";
            predicates.add("(LOWER(p.pickup_location) LIKE LOWER(?) OR LOWER(u.campus_area) LIKE LOWER(?))");
            params.add(locationPattern);
            params.add(locationPattern);
        }

        if (Boolean.TRUE.equals(autoDropOnly)) {
            predicates.add("p.auto_drop_enabled = 1 AND adc.config_id IS NOT NULL AND adc.is_halted = 0");
        }

        if (Boolean.TRUE.equals(verifiedOnly)) {
            predicates.add("u.is_campus_verified = 1");
        }

        String whereClause = "WHERE " + String.join(" AND ", predicates);
        String orderByClause = resolveOrderByClause(sort);

        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(MAX_LIMIT, limit));
        int offset = (safePage - 1) * safeLimit;

        String countSql = COUNT_FROM_CLAUSE + whereClause;
        String dataSql = SELECT_COLUMNS + whereClause + " " + orderByClause + " LIMIT ? OFFSET ?";

        return new BuiltSqlQuery(countSql, dataSql, params, safePage, safeLimit, offset);
    }

    /**
     * Strict allowlist switch for {@code ORDER BY} clauses — never interpolates user input.
     */
    private static String resolveOrderByClause(String sortKey) {
        if (sortKey == null) {
            return "ORDER BY p.published_at DESC, p.listing_id DESC";
        }
        return switch (sortKey) {
            case "price_asc" -> "ORDER BY p.current_asking_price ASC, p.published_at DESC";
            case "price_desc" -> "ORDER BY p.current_asking_price DESC, p.published_at DESC";
            case "soonest_drop" -> "ORDER BY CASE WHEN p.auto_drop_enabled = 1 AND adc.next_drop_at IS NOT NULL AND adc.is_halted = 0 THEN 0 ELSE 1 END ASC, adc.next_drop_at ASC, p.published_at DESC";
            case "newest" -> "ORDER BY p.published_at DESC, p.listing_id DESC";
            default -> "ORDER BY p.published_at DESC, p.listing_id DESC";
        };
    }

    private static String normalizeFilterText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
