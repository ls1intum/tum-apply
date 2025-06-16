package de.tum.cit.aet.core.util;

import jakarta.persistence.Query;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

public final class SqlQueryUtil {

    private SqlQueryUtil() {}

    /**
     * Adds dynamic <code>column IN (:paramX)</code> fragments to an existing SQL
     * <code>WHERE</code> section. Every value list gets its own named parameter
     * (<code>param0</code>, <code>param1</code>, …).
     *
     * @param sql            SQL StringBuilder positioned after the static WHERE
     * @param dynamicFilters map «column → permitted values» coming from the UI
     * @param params         parameter map that will be fed into a JPA Query
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
     * Builds a complete <code>ORDER BY ...</code> clause from a Spring
     * {@link Pageable}. Only properties contained in {@code sortColumns} are
     * accepted; everything else is silently ignored for safety. The clause is
     * guaranteed to finish with {@code secondarySortColumn} so that the result
     * order is deterministic even when the primary key(s) are equal.
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
     * Binds named parameters (with collection handling) on a JPA native query.
     */
    public static void bindParameters(Query q, Map<String, Object> params) {
        for (var e : params.entrySet()) {
            Object v = e.getValue();
            q.setParameter(e.getKey(), v);
        }
    }
}
