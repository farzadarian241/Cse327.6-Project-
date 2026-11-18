/**
 * <h2>Pattern 6: Builder Pattern</h2>
 *
 * <p>Textbook Gang of Four (GoF) Creational Builder pattern for constructing dynamic,
 * parameterized MySQL {@code SELECT} and {@code COUNT} queries for marketplace browsing
 * and faceted search without string concatenation of untrusted user input.</p>
 *
 * <ul>
 *   <li><strong>Builder:</strong> {@link com.haatbodol.patterns.builder.SqlQueryBuilder}</li>
 *   <li><strong>ConcreteBuilder:</strong> {@link com.haatbodol.patterns.builder.ListingQueryBuilder}</li>
 *   <li><strong>Product:</strong> {@link com.haatbodol.patterns.builder.BuiltSqlQuery}</li>
 * </ul>
 */
package com.haatbodol.patterns.builder;
