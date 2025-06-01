package de.tum.cit.aet.core.util;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Sort;

public class CriteriaUtils {

    private CriteriaUtils() {}

    /**
     * Converts a Spring Data {@link Sort} into a list of JPA {@link Order} objects.
     *
     * @param cb   the CriteriaBuilder
     * @param root the root entity
     * @param sort the sort specification
     * @return list of JPA Order instances
     */
    public static List<Order> buildSortOrders(CriteriaBuilder cb, Root<?> root, Sort sort) {
        List<Order> orders = new ArrayList<>();
        for (Sort.Order s : sort) {
            Path<Object> path = resolvePath(root, s.getProperty());
            orders.add(s.isAscending() ? cb.asc(path) : cb.desc(path));
        }
        return orders;
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
