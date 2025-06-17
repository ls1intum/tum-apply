package de.tum.cit.aet.core.util;

import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Sort;

public class CriteriaUtils {

    private CriteriaUtils() {}

    /**
     * Converts a Spring Data {@link Sort} into a list of JPA {@link Order} objects.
     *
     * @param cb   the CriteriaBuilder
     * @param root the root entity
     * @param sort the sort specification
     * @param secondarySortColumn the column to use as a tiebreaker for deterministic ordering
     * @return list of JPA Order instances
     */
    public static List<Order> buildSortOrders(CriteriaBuilder cb, Root<?> root, Sort sort, String secondarySortColumn) {
        List<Order> orders = new ArrayList<>();
        for (Sort.Order s : sort) {
            Path<Object> path = resolvePath(root, s.getProperty());
            orders.add(s.isAscending() ? cb.asc(path) : cb.desc(path));
        }
        if (secondarySortColumn != null && !secondarySortColumn.isEmpty()) {
            Path<Object> path = resolvePath(root, secondarySortColumn);
            orders.add(cb.asc(path));
        }
        return orders;
    }

    /**
     * Builds a list of {@link Predicate} based on dynamic filters.
     * Each entry maps a property path (e.g. "job.title") to a list of acceptable values.
     *
     * @param cb             the CriteriaBuilder
     * @param root           the root entity
     * @param dynamicFilters a map of field names to value lists
     * @return a list of predicates for filtering
     */
    public static List<Predicate> buildDynamicFilters(CriteriaBuilder cb, Root<?> root, Map<String, List<?>> dynamicFilters) {
        List<Predicate> predicates = new ArrayList<>();
        if (dynamicFilters == null || dynamicFilters.isEmpty()) return predicates;

        for (Map.Entry<String, List<?>> entry : dynamicFilters.entrySet()) {
            String property = entry.getKey();
            List<?> values = entry.getValue();
            if (values == null || values.isEmpty()) continue;

            Path<Object> path = resolvePath(root, property);
            predicates.add(path.in(values));
        }

        return predicates;
    }

    /**
     * Resolves a nested property path such as "job.title" into a JPA {@link Path} object.
     *
     * @param root         the root path
     * @param propertyPath the dot-separated path
     * @return a JPA path object
     */
    @SuppressWarnings("unchecked")
    private static Path<Object> resolvePath(Path<?> root, String propertyPath) {
        String[] parts = propertyPath.split("\\.");
        Path<?> path = root;
        for (String part : parts) {
            path = path.get(part);
        }
        return (Path<Object>) path;
    }
}
