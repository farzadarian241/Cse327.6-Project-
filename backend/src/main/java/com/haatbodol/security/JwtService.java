package com.haatbodol.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * JWT authentication, HTTP-only session cookie lifecycle, campus domain verification,
 * and user payload sanitization for HaatBodol.
 */
@Service
public class JwtService {

    public static final String SESSION_COOKIE_NAME = "haatbodol_session";
    public static final long SESSION_MAX_AGE_SECONDS = 7L * 24L * 3600L; // 7 days

    private static final Pattern CAMPUS_EMAIL_PATTERN =
            Pattern.compile("@(.*\\.)?(?:edu|edu\\.bd|ac\\.bd)$", Pattern.CASE_INSENSITIVE);

    private final SecretKey secretKey;
    private final boolean cookieSecure;

    public JwtService(
            @Value("${haatbodol.jwt.secret:haatbodol_super_secret_university_key_2026}") String jwtSecret,
            @Value("${haatbodol.cookie.secure:false}") boolean cookieSecure
    ) {
        this.secretKey = buildHmacKey(jwtSecret);
        this.cookieSecure = cookieSecure;
    }

    /**
     * Ensures the HS256 signing key is always at least 256 bits (32 bytes) as required by JJWT.
     */
    private static SecretKey buildHmacKey(String rawSecret) {
        String effective = (rawSecret == null || rawSecret.isBlank())
                ? "haatbodol_super_secret_university_key_2026"
                : rawSecret;
        byte[] keyBytes = effective.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                keyBytes = digest.digest(keyBytes);
            } catch (NoSuchAlgorithmException e) {
                throw new IllegalStateException("SHA-256 algorithm unavailable for JWT key derivation", e);
            }
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Signs an HS256 JWT valid for 7 days containing the core user session claims.
     */
    public String signAuthToken(Map<String, Object> userMap) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(SESSION_MAX_AGE_SECONDS);

        Object userIdObj = userMap.get("user_id");
        Long userId = toLong(userIdObj);
        String email = userMap.get("email") != null ? String.valueOf(userMap.get("email")) : "";
        String activeRole = userMap.get("active_role") != null ? String.valueOf(userMap.get("active_role")) : "BUYER";
        String accountType = userMap.get("account_type") != null ? String.valueOf(userMap.get("account_type")) : "USER";

        return Jwts.builder()
                .subject(userId != null ? String.valueOf(userId) : email)
                .claim("user_id", userId)
                .claim("email", email)
                .claim("active_role", activeRole)
                .claim("account_type", accountType)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Verifies an HS256 JWT and returns its decoded payload claims, or {@code null} if invalid/expired.
     */
    public Map<String, Object> verifyAuthToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token.trim())
                    .getPayload();

            Map<String, Object> session = new LinkedHashMap<>();
            Long userId = toLong(claims.get("user_id"));
            if (userId == null && claims.getSubject() != null) {
                userId = toLong(claims.getSubject());
            }
            if (userId == null) {
                return null;
            }
            session.put("user_id", userId);
            session.put("email", claims.get("email", String.class));
            session.put("active_role", claims.get("active_role", String.class));
            session.put("account_type", claims.get("account_type", String.class));
            return session;
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    /**
     * Extracts and verifies the {@code haatbodol_session} cookie from an incoming HTTP request.
     */
    public Map<String, Object> extractSessionFromRequest(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String token = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (SESSION_COOKIE_NAME.equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        // Fallback to manual Cookie header parsing if servlet container didn't populate cookies array
        if ((token == null || token.isBlank()) && request.getHeader("Cookie") != null) {
            String cookieHeader = request.getHeader("Cookie");
            String[] parts = cookieHeader.split(";");
            for (String part : parts) {
                String trimmed = part.trim();
                if (trimmed.startsWith(SESSION_COOKIE_NAME + "=")) {
                    String rawVal = trimmed.substring((SESSION_COOKIE_NAME + "=").length());
                    try {
                        token = URLDecoder.decode(rawVal, StandardCharsets.UTF_8);
                    } catch (IllegalArgumentException ignored) {
                        token = rawVal;
                    }
                    break;
                }
            }
        }

        if (token == null || token.isBlank()) {
            return null;
        }

        return verifyAuthToken(token);
    }

    /**
     * Extracts and verifies the authenticated principal from an incoming HTTP request.
     *
     * @param request incoming HTTP servlet request
     * @return {@link AuthenticatedUser} principal, or {@code null} if unauthenticated/invalid
     */
    public AuthenticatedUser extractAuthenticatedUser(HttpServletRequest request) {
        return AuthenticatedUser.fromSessionMap(extractSessionFromRequest(request));
    }

    /**
     * Builds the HTTP-only session cookie carrying the signed JWT (7-day expiration).
     */
    public ResponseCookie createAuthCookie(String token) {
        return ResponseCookie.from(SESSION_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(SESSION_MAX_AGE_SECONDS)
                .build();
    }

    /**
     * Builds an expired cookie that immediately clears {@code haatbodol_session} in the browser.
     */
    public ResponseCookie createClearCookie() {
        return ResponseCookie.from(SESSION_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }

    /**
     * Detects institutional university email domains (.edu, .edu.bd, .ac.bd).
     */
    public boolean isCampusEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        return CAMPUS_EMAIL_PATTERN.matcher(normalized).find();
    }

    /**
     * Returns a defensive copy of a user record map with {@code password_hash} strictly removed
     * and {@code is_campus_verified} normalized to an integer (0 or 1).
     */
    public Map<String, Object> sanitizeUser(Map<String, Object> userMap) {
        if (userMap == null) {
            return null;
        }
        Map<String, Object> safeUser = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : userMap.entrySet()) {
            if ("password_hash".equals(entry.getKey())) {
                continue;
            }
            safeUser.put(entry.getKey(), entry.getValue());
        }
        if (safeUser.containsKey("is_campus_verified")) {
            Object rawVerified = safeUser.get("is_campus_verified");
            if (rawVerified instanceof Boolean boolVal) {
                safeUser.put("is_campus_verified", boolVal ? 1 : 0);
            } else if (rawVerified instanceof Number numVal) {
                safeUser.put("is_campus_verified", numVal.intValue() != 0 ? 1 : 0);
            } else if (rawVerified != null) {
                String s = rawVerified.toString().trim().toLowerCase(Locale.ROOT);
                safeUser.put("is_campus_verified", ("1".equals(s) || "true".equals(s)) ? 1 : 0);
            } else {
                safeUser.put("is_campus_verified", 0);
            }
        }
        return safeUser;
    }

    private static Long toLong(Object val) {
        if (val == null) {
            return null;
        }
        if (val instanceof Number num) {
            return num.longValue();
        }
        try {
            return Long.parseLong(val.toString().trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
