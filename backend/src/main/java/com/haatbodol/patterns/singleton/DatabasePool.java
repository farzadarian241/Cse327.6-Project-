package com.haatbodol.patterns.singleton;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <h2>Pattern 1A: Singleton Pattern — {@code DatabasePool}</h2>
 *
 * <p><strong>GoF Classification:</strong> Creational Pattern (Singleton)</p>
 * <p><strong>GoF Participant:</strong> {@code Singleton} — defines a static {@link #getInstance()}
 * operation that lets clients access its unique instance, and hides its constructor so no
 * second connection pool can be instantiated across the JVM.</p>
 *
 * <p><strong>Implementation Details:</strong></p>
 * <ul>
 *   <li>Uses thread-safe <em>Double-Checked Locking</em> with a {@code volatile} static reference.</li>
 *   <li>Wraps a single {@link HikariDataSource} configured with {@code maxPoolSize = 10}.</li>
 *   <li>Loads MySQL settings in priority order: OS Environment Variables &rarr;
 *       JVM System Properties &rarr; {@code .env.local} file (workspace root or current dir) &rarr;
 *       safe local defaults ({@code 127.0.0.1:3306/haatbodol_db}, user {@code root}, empty password).</li>
 * </ul>
 */
public final class DatabasePool {

    private static final String DEFAULT_DB_HOST = "127.0.0.1";
    private static final String DEFAULT_DB_PORT = "3306";
    private static final String DEFAULT_DB_USER = "root";
    private static final String DEFAULT_DB_PASSWORD = "";
    private static final String DEFAULT_DB_NAME = "haatbodol_db";
    private static final int MAX_POOL_SIZE = 10;

    /**
     * Volatile Singleton reference ensuring happens-before memory visibility
     * across threads during lazy initialization.
     */
    private static volatile DatabasePool instance;

    /**
     * Single shared HikariCP connection pool managed by this Singleton.
     */
    private final HikariDataSource dataSource;

    /**
     * True private constructor preventing external instantiation via {@code new DatabasePool()}.
     */
    private DatabasePool() {
        Map<String, String> envFile = loadDotEnvLocal();

        String host = resolveConfig("DB_HOST", "haatbodol.db.host", envFile, DEFAULT_DB_HOST);
        String port = resolveConfig("DB_PORT", "haatbodol.db.port", envFile, DEFAULT_DB_PORT);
        String user = resolveConfig("DB_USER", "haatbodol.db.user", envFile, DEFAULT_DB_USER);
        String password = resolveConfig("DB_PASSWORD", "haatbodol.db.password", envFile, DEFAULT_DB_PASSWORD);
        String dbName = resolveConfig("DB_NAME", "haatbodol.db.name", envFile, DEFAULT_DB_NAME);

        String jdbcUrl = String.format(
                "jdbc:mysql://%s:%s/%s?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8",
                host,
                port,
                dbName
        );

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(user);
        config.setPassword(password);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setPoolName("HaatBodolHikariPool");
        config.setMaximumPoolSize(MAX_POOL_SIZE);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30_000L);
        config.setIdleTimeout(600_000L);
        config.setMaxLifetime(1_800_000L);
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

        this.dataSource = new HikariDataSource(config);
    }

    /**
     * Global access point returning the unique {@link DatabasePool} instance.
     *
     * <p>Implements textbook thread-safe double-checked locking so synchronization
     * overhead is incurred only once during initial creation.</p>
     *
     * @return the sole {@link DatabasePool} instance for the application
     */
    public static DatabasePool getInstance() {
        if (instance == null) {
            synchronized (DatabasePool.class) {
                if (instance == null) {
                    instance = new DatabasePool();
                }
            }
        }
        return instance;
    }

    /**
     * Borrows a JDBC {@link Connection} from the singleton HikariCP pool.
     * Callers must close the returned connection (e.g., via try-with-resources)
     * to return it to the pool.
     *
     * @return an active JDBC connection to MySQL
     * @throws SQLException if a database access error occurs
     */
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    /**
     * Exposes the underlying singleton {@link HikariDataSource} for inspection,
     * metrics, or JDBC helpers.
     *
     * @return the shared {@link HikariDataSource}
     */
    public HikariDataSource getDataSource() {
        return dataSource;
    }

    /**
     * Prevents cloning of the Singleton instance.
     */
    @Override
    protected Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException("Cloning of Singleton DatabasePool is prohibited.");
    }

    /**
     * Resolves a configuration value using priority:
     * System Environment &rarr; JVM System Property &rarr; {@code .env.local} &rarr; Default.
     */
    private static String resolveConfig(
            String envKey,
            String sysPropKey,
            Map<String, String> envFile,
            String defaultValue
    ) {
        String envVal = System.getenv(envKey);
        if (envVal != null) {
            return envVal;
        }
        String sysProp = System.getProperty(sysPropKey);
        if (sysProp != null) {
            return sysProp;
        }
        if (envFile.containsKey(envKey)) {
            return envFile.get(envKey);
        }
        return defaultValue;
    }

    /**
     * Reads key=value pairs from {@code .env.local} in either the current working
     * directory or its parent directory (so launching from {@code backend/} finds
     * the workspace root {@code .env.local}).
     */
    private static Map<String, String> loadDotEnvLocal() {
        Map<String, String> values = new HashMap<>();
        List<Path> candidates = List.of(
                Paths.get(".env.local"),
                Paths.get("..", ".env.local")
        );

        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) {
                try {
                    for (String rawLine : Files.readAllLines(candidate, StandardCharsets.UTF_8)) {
                        String line = rawLine.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx <= 0) {
                            continue;
                        }
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();
                        if ((value.startsWith("\"") && value.endsWith("\""))
                                || (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        values.put(key, value);
                    }
                    break;
                } catch (IOException ignored) {
                    // Fall back cleanly to environment variables and defaults
                }
            }
        }
        return values;
    }
}
