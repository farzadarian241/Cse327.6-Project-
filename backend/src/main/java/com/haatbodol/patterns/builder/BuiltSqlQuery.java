package com.haatbodol.patterns.builder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * <h2>Pattern 6: Builder Pattern — {@code BuiltSqlQuery}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code Product} — immutable holder containing the
 * parameterized {@code COUNT(*)} SQL statement, the parameterized data {@code SELECT} SQL
 * statement (including {@code ORDER BY} and {@code LIMIT ? OFFSET ?}), the ordered list of
 * JDBC {@link java.sql.PreparedStatement} filter parameters, and pagination metadata.</p>
 */
public final class BuiltSqlQuery {

    private final String countSql;
    private final String dataSql;
    private final List<Object> parameters;
    private final List<Object> dataParameters;
    private final int page;
    private final int limit;
    private final int offset;

    public BuiltSqlQuery(
            String countSql,
            String dataSql,
            List<Object> filterParameters,
            int page,
            int limit,
            int offset
    ) {
        this.countSql = countSql;
        this.dataSql = dataSql;
        List<Object> safeFilterParams = filterParameters != null
                ? new ArrayList<>(filterParameters)
                : new ArrayList<>();
        this.parameters = Collections.unmodifiableList(safeFilterParams);

        List<Object> combinedDataParams = new ArrayList<>(safeFilterParams);
        combinedDataParams.add(limit);
        combinedDataParams.add(offset);
        this.dataParameters = Collections.unmodifiableList(combinedDataParams);

        this.page = page;
        this.limit = limit;
        this.offset = offset;
    }

    /**
     * Parameterized {@code SELECT COUNT(*) AS total ...} statement matching all active filters.
     * Bind {@link #getParameters()} to its {@link java.sql.PreparedStatement}.
     */
    public String getCountSql() {
        return countSql;
    }

    /**
     * Parameterized {@code SELECT ... ORDER BY ... LIMIT ? OFFSET ?} statement.
     * Bind {@link #getDataParameters()} to its {@link java.sql.PreparedStatement}.
     */
    public String getDataSql() {
        return dataSql;
    }

    /**
     * Ordered immutable list of {@code WHERE} filter parameters for {@link #getCountSql()}.
     */
    public List<Object> getParameters() {
        return parameters;
    }

    /**
     * Ordered immutable list of {@code WHERE} filter parameters followed by {@code limit} and
     * {@code offset} for {@link #getDataSql()}.
     */
    public List<Object> getDataParameters() {
        return dataParameters;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }

    public int getOffset() {
        return offset;
    }
}
