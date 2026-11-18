package com.haatbodol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

/**
 * Main entry point for the HaatBodol Spring Boot backend service.
 *
 * <p>Spring Boot's default {@link DataSourceAutoConfiguration} is explicitly excluded
 * so that all MySQL connection pooling is managed exclusively through the textbook
 * GoF Singleton {@link com.haatbodol.patterns.singleton.DatabasePool}.</p>
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class HaatBodolApplication {

    public static void main(String[] args) {
        SpringApplication.run(HaatBodolApplication.class, args);
    }
}
