package com.haatbodol.security;

import java.util.Map;

/**
 * Lightweight immutable authenticated principal extracted from the verified
 * {@code haatbodol_session} JWT cookie.
 */
public final class AuthenticatedUser {

    private final long userId;
    private final String email;
    private final String activeRole;
    private final String accountType;

    public AuthenticatedUser(long userId, String email, String activeRole, String accountType) {
        this.userId = userId;
        this.email = email != null ? email : "";
        this.activeRole = (activeRole != null && !activeRole.isBlank()) ? activeRole : "BUYER";
        this.accountType = (accountType != null && !accountType.isBlank()) ? accountType : "USER";
    }

    /**
     * Static factory converting the session claims map returned by
     * {@link JwtService#extractSessionFromRequest} into an {@link AuthenticatedUser}.
     *
     * @param session decoded JWT session map, or {@code null}
     * @return authenticated principal, or {@code null} when unauthenticated
     */
    public static AuthenticatedUser fromSessionMap(Map<String, Object> session) {
        if (session == null || session.get("user_id") == null) {
            return null;
        }
        Long userId = toLong(session.get("user_id"));
        if (userId == null) {
            return null;
        }
        String email = session.get("email") != null ? String.valueOf(session.get("email")) : "";
        String activeRole = session.get("active_role") != null ? String.valueOf(session.get("active_role")) : "BUYER";
        String accountType = session.get("account_type") != null ? String.valueOf(session.get("account_type")) : "USER";
        return new AuthenticatedUser(userId, email, activeRole, accountType);
    }

    public long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getActiveRole() {
        return activeRole;
    }

    public String getAccountType() {
        return accountType;
    }

    /**
     * Returns {@code true} if this principal carries the {@code ADMIN} account type.
     */
    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(accountType);
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
