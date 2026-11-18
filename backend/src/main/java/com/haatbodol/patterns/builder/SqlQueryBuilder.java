package com.haatbodol.patterns.builder;

/**
 * <h2>Pattern 6: Builder Pattern — {@code SqlQueryBuilder}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code Builder} — declares the step-by-step fluent
 * interface for assembling parameterized SQL queries with dynamic filters, safe allowlisted
 * sorting, and pagination.</p>
 */
public interface SqlQueryBuilder {

    SqlQueryBuilder withKeyword(String keyword);

    SqlQueryBuilder withCategory(String category);

    SqlQueryBuilder withMinPrice(Double minPrice);

    SqlQueryBuilder withMaxPrice(Double maxPrice);

    SqlQueryBuilder withCondition(String condition);

    SqlQueryBuilder withLocation(String location);

    SqlQueryBuilder withAutoDropOnly(Boolean autoDropOnly);

    SqlQueryBuilder withVerifiedOnly(Boolean verifiedOnly);

    SqlQueryBuilder withSort(String sort);

    SqlQueryBuilder withPage(Integer page);

    SqlQueryBuilder withLimit(Integer limit);

    BuiltSqlQuery build();
}
