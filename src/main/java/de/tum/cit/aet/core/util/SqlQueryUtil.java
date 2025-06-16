package de.tum.cit.aet.core.util;

import jakarta.persistence.Query;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

public final class SqlQueryUtil {

    private SqlQueryUtil() {}

    /**
     * Appends dynamic filter conditions to the given SQL query and binds corresponding parameters.
     * For each dynamic filter, generates a SQL <code>IN</code> clause and parameter name,
     * and updates the parameter map with the filter values.
     *
     * @param sql the {@link StringBuilder} containing the SQL query to append to
     * @param filterColumns a map of filter keys to SQL column names
     * @param dynamicFilters a map of filter keys to lists of filter values
     * @param params the map to which generated parameter names and their values will be added
     */
    public static void appendDynamicFilters(
        StringBuilder sql,
        Map<String, String> filterColumns,
        Map<String, List<?>> dynamicFilters,
        Map<String, Object> params
    ) {
        if (dynamicFilters == null || dynamicFilters.isEmpty()) {
            return;
        }
        int index = 0;
        for (var entry : dynamicFilters.entrySet()) {
            var values = entry.getValue().stream().map(String::valueOf).toList();
            if (values == null || values.isEmpty()) {
                continue;
            }
            String filterColumn = filterColumns.get(entry.getKey());
            if (filterColumn == null) {
                continue;
            }

            String param = "dyn_param" + index++;
            sql.append(" AND ").append(filterColumn).append(" IN (:").append(param).append(')');
            params.put(param, values);
        }
    }

    /**
     * Builds an SQL <code>ORDER BY</code> clause from the given {@link Sort} object.
     * Maps user-specified sort properties to SQL columns, applies a default sort if none are provided,
     * and optionally appends a secondary sort column for deterministic ordering.
     *
     * @param sort the {@link Sort} object specifying the sorting criteria
     * @param sortColumns a map of sort property names to SQL column names
     * @param defaultSortColumn the SQL column to use if no user sort is provided
     * @param secondarySortColumn an optional secondary SQL column to ensure deterministic ordering (may be {@code null})
     * @return the generated SQL <code>ORDER BY</code> clause as a string
     */
    public static String buildOrderByClause(
        @NonNull Sort sort,
        @NonNull Map<String, String> sortColumns,
        @NonNull String defaultSortColumn,
        String secondarySortColumn
    ) {
        StringBuilder order = new StringBuilder("ORDER BY ");
        boolean hadUserSort = false;

        for (Sort.Order o : sort) {
            String mapped = sortColumns.get(o.getProperty());
            if (mapped == null) {
                continue;
            }
            order.append(mapped).append(' ').append(o.isAscending() ? "ASC" : "DESC");
            hadUserSort = true;
        }

        if (!hadUserSort) {
            // use default sort column as fallback
            order.append(defaultSortColumn).append(" DESC");
        }

        // deterministic finishing key
        if (secondarySortColumn != null) {
            order.append(" ,").append(secondarySortColumn);
        }
        return order.toString();
    }

    /**
     * Binds the provided named parameters to the given {@link Query}.
     * Iterates over the parameter map and sets each parameter on the query.
     *
     * @param q the {@link Query} to which parameters will be bound
     * @param params a map of parameter names to their values
     */
    public static void bindParameters(Query q, Map<String, Object> params) {
        for (var e : params.entrySet()) {
            Object v = e.getValue();
            q.setParameter(e.getKey(), v);
        }
    }
}
