package com.haatbodol.patterns.decorator;

import com.haatbodol.model.ListingDto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * <h2>Pattern 8: Decorator Pattern — {@code AutoDropCountdownDecorator}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code ConcreteDecorator} — computes the next
 * scheduled Dutch auction price ({@code max(min_reserve_price, round(current * 0.95))})
 * and a human-readable countdown label ({@code "Drops 5% in Xd Yh"},
 * {@code "Drops 5% in Xh"}, or {@code "Drops 5% Soon"}) whenever
 * {@code auto_drop_enabled} is true and {@code is_halted} is false.</p>
 */
public class AutoDropCountdownDecorator extends ListingPresentationDecorator {

    private static final int DROP_PERCENTAGE = 5;
    private static final double DROP_MULTIPLIER = 0.95;
    private static final DateTimeFormatter MYSQL_DATETIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public AutoDropCountdownDecorator(ListingPresentationComponent wrappedComponent) {
        super(wrappedComponent);
    }

    @Override
    protected void applyDecoration(Map<String, Object> decorators) {
        ListingDto listing = getBaseListing();
        boolean isAutoDropActive = Boolean.TRUE.equals(listing.getAutoDropEnabled())
                && !Boolean.TRUE.equals(listing.getIsHalted());
        double currentPrice = listing.getCurrentAskingPrice() != null ? listing.getCurrentAskingPrice() : 0.0;
        double minReserve = listing.getMinReservePrice() != null ? listing.getMinReservePrice() : 0.0;

        if (!isAutoDropActive) {
            decorators.put("autoDropBadge", null);

            Map<String, Object> inactiveMeta = new LinkedHashMap<>();
            inactiveMeta.put("active", false);
            inactiveMeta.put("currentPrice", currentPrice);
            inactiveMeta.put("nextDropPrice", null);
            inactiveMeta.put("dropPercentage", DROP_PERCENTAGE);
            inactiveMeta.put("nextDropAt", null);
            inactiveMeta.put("hoursRemaining", null);
            inactiveMeta.put("minReservePrice", minReserve);
            inactiveMeta.put("formattedNextDropPrice", null);
            decorators.put("auctionMeta", inactiveMeta);
            return;
        }

        double nextDropPrice = Math.max(minReserve, Math.round(currentPrice * DROP_MULTIPLIER));
        Long hoursRemaining = null;
        String label = "Drops 5% Soon";

        Instant dropInstant = parseTimestamp(listing.getNextDropAt());
        if (dropInstant != null) {
            long diffMs = dropInstant.toEpochMilli() - System.currentTimeMillis();
            if (diffMs <= 0L) {
                hoursRemaining = 0L;
                label = "Drops 5% Soon";
            } else {
                long hours = Math.max(1L, Math.round(diffMs / 3_600_000.0));
                hoursRemaining = hours;
                long days = hours / 24L;
                long remHours = hours % 24L;

                if (days > 0L) {
                    label = remHours > 0L
                            ? "Drops 5% in " + days + "d " + remHours + "h"
                            : "Drops 5% in " + days + "d";
                } else {
                    label = "Drops 5% in " + hours + "h";
                }
            }
        }

        Map<String, Object> autoDropBadge = new LinkedHashMap<>();
        autoDropBadge.put("label", label);
        autoDropBadge.put("nextDropPrice", nextDropPrice);
        autoDropBadge.put("hoursRemaining", hoursRemaining);
        autoDropBadge.put("dropPercentage", DROP_PERCENTAGE);
        autoDropBadge.put("active", true);

        Map<String, Object> auctionMeta = new LinkedHashMap<>();
        auctionMeta.put("active", true);
        auctionMeta.put("currentPrice", currentPrice);
        auctionMeta.put("nextDropPrice", nextDropPrice);
        auctionMeta.put("dropPercentage", DROP_PERCENTAGE);
        auctionMeta.put("nextDropAt", listing.getNextDropAt());
        auctionMeta.put("hoursRemaining", hoursRemaining);
        auctionMeta.put("minReservePrice", minReserve);
        auctionMeta.put("formattedNextDropPrice", formatTaka(nextDropPrice));

        decorators.put("autoDropBadge", autoDropBadge);
        decorators.put("auctionMeta", auctionMeta);
    }

    /**
     * Parses ISO-8601 instants, offset date-times, and MySQL {@code DATETIME} strings safely.
     */
    private static Instant parseTimestamp(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        try {
            return Instant.parse(trimmed);
        } catch (DateTimeParseException ignored) {
            // Try OffsetDateTime next
        }
        try {
            return OffsetDateTime.parse(trimmed).toInstant();
        } catch (DateTimeParseException ignored) {
            // Try LocalDateTime (ISO or MySQL space-separated)
        }
        try {
            return LocalDateTime.parse(trimmed).toInstant(ZoneOffset.UTC);
        } catch (DateTimeParseException ignored) {
            // Try MySQL DATETIME format yyyy-MM-dd HH:mm:ss
        }
        try {
            return LocalDateTime.parse(trimmed, MYSQL_DATETIME_FORMAT).toInstant(ZoneOffset.UTC);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
}
