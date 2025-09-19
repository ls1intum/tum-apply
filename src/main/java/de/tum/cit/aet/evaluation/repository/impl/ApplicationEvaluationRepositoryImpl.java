package de.tum.cit.aet.evaluation.repository.impl;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.Application_;
import de.tum.cit.aet.core.util.CriteriaUtils;
import de.tum.cit.aet.core.util.SqlQueryUtil;
import de.tum.cit.aet.evaluation.repository.custom.ApplicationEvaluationRepositoryCustom;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.domain.Job_;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.Applicant_;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup_;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.User_;
import jakarta.persistence.*;
import jakarta.persistence.criteria.*;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
public class ApplicationEvaluationRepositoryImpl implements ApplicationEvaluationRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    private static final Map<String, String> FILTER_COLUMNS = Map.ofEntries(
        Map.entry("state", "a.application_state"),
        Map.entry("job.jobId", "j.job_id")
    );

    private static final Map<String, String> SORT_COLUMNS = Map.ofEntries(
            Map.entry("name", "u.last_name"),
            Map.entry("appliedAt", "a.created_at"),
            Map.entry("status", "a.application_state"),
            Map.entry("job", "j.title"));

    private static final Map<String, String> SORT_FIELD_MAPPING = Map.ofEntries(
            Map.entry("name", "applicant.user.lastName"),
            Map.entry("appliedAt", "createdAt"),
            Map.entry("status", "state"),
            Map.entry("job", "job.title"));

    /**
     * Retrieves a paginated list of {@link Application} entities for a given research group,
     * filtered by application states and optional dynamic filters, and ordered according to the provided pageable.
     */
    @Override
    public List<Application> findApplications(
            UUID researchGroupId,
            Collection<ApplicationState> states,
            Pageable pageable,
            Map<String, List<?>> dynamicFilters,
            String searchQuery) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Application> cq = cb.createQuery(Application.class);

        Root<Application> root = cq.from(Application.class);
        Join<Application, Job> jobJoin = root.join(Application_.JOB, JoinType.INNER);
        Join<Application, Applicant> applicantJoin = root.join(Application_.APPLICANT, JoinType.LEFT);
        Join<Applicant, User> userJoin = applicantJoin.join(Applicant_.USER, JoinType.LEFT);

        List<Predicate> predicates = buildCommonPredicates(cb, root, jobJoin,
                researchGroupId, states, dynamicFilters, searchQuery);

        Sort mappedSort = mapSortFields(pageable.getSort());
        List<Order> orders = buildCustomSortOrders(cb, root, jobJoin, applicantJoin, userJoin, mappedSort);

        cq.select(root)
                .where(predicates.toArray(new Predicate[0]))
                .orderBy(orders);

        TypedQuery<Application> query = em.createQuery(cq);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        return query.getResultList();
    }

    /**
     * This method transforms sort fields from the API layer (e.g., "name", "job")
     * to the actual entity relationship paths (e.g., "applicant.user.lastName",
     * "job.title").
     * This abstraction allows for cleaner URLs while maintaining proper entity
     * navigation.
     * 
     * @param originalSort the {@link Sort} object containing user-friendly field
     *                     names
     * @return a new {@link Sort} object with mapped entity property paths
     */
    private Sort mapSortFields(Sort originalSort) {
        List<Sort.Order> mappedOrders = new ArrayList<>();

        for (Sort.Order order : originalSort) {
            String originalField = order.getProperty();
            String mappedField = SORT_FIELD_MAPPING.getOrDefault(originalField, originalField);

            Sort.Order mappedOrder = new Sort.Order(order.getDirection(), mappedField);
            mappedOrders.add(mappedOrder);
        }

        return Sort.by(mappedOrders);
    }

    /**
     * Builds JPA {@link Order} objects for sorting query results based on the
     * provided sort criteria.
     * This method creates the appropriate sort expressions by using pre-established
     * joins
     * to handle nested entity relationships. It maps entity property paths to their
     * corresponding
     * JPA expressions, ensuring that sorting works correctly across entity
     * relationships.
     * 
     * @param cb            the {@link CriteriaBuilder} for creating criteria
     *                      expressions
     * @param root          the root {@link Application} entity in the criteria
     *                      query
     * @param jobJoin       the join to the {@link Job} entity
     * @param applicantJoin the join to the {@link Applicant} entity
     * @param userJoin      the join to the {@link User} entity through the
     *                      applicant relationship
     * @param sort          the {@link Sort} specification containing the mapped
     *                      entity property paths
     * @return a list of {@link Order} objects for use in the criteria query's
     *         orderBy clause
     */
    private List<Order> buildCustomSortOrders(
            CriteriaBuilder cb,
            Root<Application> root,
            Join<Application, Job> jobJoin,
            Join<Application, Applicant> applicantJoin,
            Join<Applicant, User> userJoin,
            Sort sort) {

        List<Order> orders = new ArrayList<>();

        for (Sort.Order sortOrder : sort) {
            String property = sortOrder.getProperty();
            boolean ascending = sortOrder.isAscending();

            Expression<?> sortExpression;

            switch (property) {
                case "applicant.user.lastName":
                    sortExpression = userJoin.get(User_.LAST_NAME);
                    break;
                case "job.title":
                    sortExpression = jobJoin.get(Job_.TITLE);
                    break;
                case "createdAt":
                    sortExpression = root.get(Application_.CREATED_AT);
                    break;
                case "state":
                    sortExpression = root.get(Application_.STATE);
                    break;
                default:
                    sortExpression = root.get(Application_.CREATED_AT);
                    break;
            }

            Order order = ascending ? cb.asc(sortExpression) : cb.desc(sortExpression);
            orders.add(order);
        }

        orders.add(cb.asc(root.get(Application_.APPLICATION_ID)));
        return orders;
    }

    /**
     * Counts the number of applications for a given research group, filtered by
     * application states
     * and optional dynamic filters.
     */
    @Override
    public long countApplications(UUID researchGroupId, Collection<ApplicationState> states,
            Map<String, List<?>> dynamicFilters, String searchQuery) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);

        Root<Application> root = cq.from(Application.class);
        Join<Application, Job> jobJoin = root.join(Application_.JOB, JoinType.INNER);

        List<Predicate> predicates = buildCommonPredicates(cb, root, jobJoin, researchGroupId, states, dynamicFilters,
                searchQuery);

        cq.select(cb.count(root)).where(predicates.toArray(new Predicate[0]));

        return em.createQuery(cq).getSingleResult();
    }

    /**
     * Finds the index (0-based) of a specific application in a dynamically filtered and sorted list
     * of applications for a given research group.
     */
    @Override
    public long findIndexOfApplication(
        UUID applicationId,
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Sort sort,
        Map<String, List<?>> dynamicFilters
    ) {
        Map<String, Object> params = new HashMap<>();
        params.put("groupId", researchGroupId);
        params.put("states", states.stream().map(ApplicationState::toString).toList());
        params.put("applicationId", applicationId);

        String orderBy = SqlQueryUtil.buildOrderByClause(sort, SORT_COLUMNS, "a.created_at", "a.application_id");

        StringBuilder sql = new StringBuilder(
            """
            WITH filtered_apps AS (
                SELECT a.*, ROW_NUMBER() OVER (%s) AS rn
                FROM applications a
                JOIN jobs j ON j.job_id = a.job_id
                JOIN users u ON u.user_id = a.applicant_id
                WHERE j.research_group_id = :groupId
                  AND a.application_state IN (:states)
            """.formatted(orderBy)
        );

        SqlQueryUtil.appendDynamicFilters(sql, FILTER_COLUMNS, dynamicFilters, params);

        sql.append(
            """
                )
                SELECT rn
                FROM filtered_apps
                WHERE application_id = :applicationId
            """
        );

        Query q = em.createNativeQuery(sql.toString());
        SqlQueryUtil.bindParameters(q, params);
        try {
            return ((Number) q.getSingleResult()).longValue() - 1; // 0-based index
        } catch (Exception e) {
            throw new EntityNotFoundException("Application not found");
        }
    }

    /**
     * Retrieves all distinct job titles of applications that belong to the given
     * research group.
     * The result list is ordered alphabetically by job title.
     *
     * @param researchGroupId the UUID of the research group
     * @return a list of unique job titles sorted in ascending order
     */
    @Override
    public List<String> findAllUniqueJobNames(UUID researchGroupId) {
        return em.createQuery(
                "SELECT DISTINCT j.title " +
                        "FROM Application a " +
                        "JOIN a.job j " +
                        "WHERE j.researchGroup.researchGroupId = :researchGroupId " +
                        "ORDER BY j.title ASC",
                String.class)
                .setParameter("researchGroupId", researchGroupId)
                .getResultList();
    }

        /**
         * Builds a list of common predicates for filtering applications based on
         * research group,
         * application states, and dynamic filters, and an optional search query.
         */
        private List<Predicate> buildCommonPredicates(
                        CriteriaBuilder cb,
                        Root<Application> root,
                        Join<Application, Job> jobJoin,
                        UUID researchGroupId,
                        Collection<ApplicationState> states,
                        Map<String, List<?>> dynamicFilters, String searchQuery) {
                List<Predicate> predicates = new ArrayList<>();

        predicates.add(cb.equal(jobJoin.get(Job_.RESEARCH_GROUP).get(ResearchGroup_.RESEARCH_GROUP_ID), researchGroupId));

                if (states != null && !states.isEmpty()) {
                        predicates.add(root.get(Application_.STATE).in(states));
                }

        if (searchQuery != null && !searchQuery.trim().isEmpty()) {

            String normalizedQuery = searchQuery.trim().toLowerCase();
            String searchPattern = "%" + normalizedQuery.toLowerCase() + "%";

                        Join<Application, Applicant> applicantJoin = root.join(Application_.APPLICANT);
                        Join<Applicant, User> userJoin = applicantJoin.join(Applicant_.USER);

                        List<Predicate> searchPredicates = new ArrayList<>();

                        // search for firstname or lastname
                        searchPredicates.add(cb.like(cb.lower(userJoin.get(User_.FIRST_NAME)), searchPattern));
                        searchPredicates.add(cb.like(cb.lower(userJoin.get(User_.LAST_NAME)), searchPattern));

                        // search for full name (format: firstname lastname)
                        Expression<String> fullName = cb.concat(
                                        cb.concat(cb.lower(userJoin.get(User_.FIRST_NAME)), " "),
                                        cb.lower(userJoin.get(User_.LAST_NAME)));
                        searchPredicates.add(cb.like(fullName, searchPattern));

                        // search for job title
                        searchPredicates.add(cb.like(cb.lower(jobJoin.get(Job_.TITLE)), searchPattern));

                        Predicate searchPredicate = cb.or(searchPredicates.toArray(new Predicate[0]));

                        predicates.add(searchPredicate);
                }

        predicates.addAll(CriteriaUtils.buildDynamicFilters(cb, root, dynamicFilters));

        return predicates;
    }
}
