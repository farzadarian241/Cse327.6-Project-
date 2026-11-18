/**
 * <h2>Pattern 7: Proxy Pattern (Protection Proxy)</h2>
 *
 * <p>Textbook Gang of Four (GoF) Structural Protection Proxy guarding sensitive seller
 * contact details (phone number, exact residential address, email) on listing reads and
 * enforcing strict owner/administrator authorization before mutating or deleting listings.</p>
 *
 * <ul>
 *   <li><strong>Subject:</strong> {@link com.haatbodol.patterns.proxy.ListingAccessService}</li>
 *   <li><strong>RealSubject:</strong> {@link com.haatbodol.patterns.proxy.RealListingAccessService}</li>
 *   <li><strong>Proxy:</strong> {@link com.haatbodol.patterns.proxy.ListingAccessProxy}</li>
 * </ul>
 */
package com.haatbodol.patterns.proxy;
