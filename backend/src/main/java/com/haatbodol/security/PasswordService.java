package com.haatbodol.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * BCrypt password hashing and verification service for user credentials stored in MySQL {@code haatbodol_db}.
 */
@Service
public class PasswordService {

    private static final int BCRYPT_STRENGTH = 10;
    private final BCryptPasswordEncoder passwordEncoder;

    public PasswordService() {
        this.passwordEncoder = new BCryptPasswordEncoder(BCRYPT_STRENGTH);
    }

    /**
     * Hashes a plaintext password using BCrypt (10 cost rounds).
     */
    public String hashPassword(String rawPassword) {
        if (rawPassword == null) {
            throw new IllegalArgumentException("Password must not be null.");
        }
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * Verifies a plaintext password against a stored BCrypt hash ({@code $2a$}, {@code $2b$}, or {@code $2y$}).
     */
    public boolean verifyPassword(String rawPassword, String encodedHash) {
        if (rawPassword == null || encodedHash == null || encodedHash.isBlank()) {
            return false;
        }
        try {
            return passwordEncoder.matches(rawPassword, encodedHash);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    /**
     * Alias for {@link #verifyPassword(String, String)}.
     */
    public boolean matches(String rawPassword, String encodedHash) {
        return verifyPassword(rawPassword, encodedHash);
    }
}
