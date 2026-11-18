package com.haatbodol.controller;

import com.haatbodol.patterns.singleton.DatabasePool;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check endpoint verifying live MySQL connectivity via the GoF Singleton {@link DatabasePool}.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        try (Connection conn = DatabasePool.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) AS count FROM product_listings");
             ResultSet rs = ps.executeQuery()) {

            long listingsCount = 0L;
            if (rs.next()) {
                listingsCount = rs.getLong("count");
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("status", "connected");
            body.put("listingsCount", listingsCount);
            return ResponseEntity.ok(body);
        } catch (Exception ex) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("status", "error");
            err.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}
