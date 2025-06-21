package de.tum.cit.aet.evaluation.repository.impl;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.Application_;
import de.tum.cit.aet.core.util.CriteriaUtils;
import de.tum.cit.aet.core.util.SqlQueryUtil;
import de.tum.cit.aet.evaluation.repository.custom.ApplicationEvaluationRepositoryCustom;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.domain.Job_;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup_;
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
        Map.entry("rating", "a.rating"),
        Map.entry("createdAt", "a.created_at"),
        Map.entry("applicant.lastName", "u.last_name")
    );

    /**
     * Retrieves a paginated list of {@link Application} entities for a given research group,
     * filtered by application states and optional dynamic filters, and ordered according to the provided pageable.
     */
    @Override
    public List<Application> findApplications(
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Pageable pageable,
        Map<String, List<?>> dynamicFilters
    ) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Application> cq = cb.createQuery(Application.class);

        Root<Application> root = cq.from(Application.class);
        Join<Application, Job> jobJoin = root.join(Application_.JOB, JoinType.INNER);

        List<Predicate> predicates = buildCommonPredicates(cb, root, jobJoin, researchGroupId, states, dynamicFilters);

        cq
            .select(root)
            .where(predicates.toArray(new Predicate[0]))
            .orderBy(CriteriaUtils.buildSortOrders(cb, root, pageable.getSort(), Application_.APPLICATION_ID));

        TypedQuery<Application> query = em.createQuery(cq);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        return query.getResultList();
    }

    /**
     * Counts the number of applications for a given research group, filtered by application states
     * and optional dynamic filters.
     */
    @Override
    public long countApplications(UUID researchGroupId, Collection<ApplicationState> states, Map<String, List<?>> dynamicFilters) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);

        Root<Application> root = cq.from(Application.class);
        Join<Application, Job> jobJoin = root.join(Application_.JOB, JoinType.INNER);

        List<Predicate> predicates = buildCommonPredicates(cb, root, jobJoin, researchGroupId, states, dynamicFilters);

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
     * Builds a list of common predicates for filtering applications based on research group,
     * application states, and dynamic filters.
     */
    private List<Predicate> buildCommonPredicates(
        CriteriaBuilder cb,
        Root<Application> root,
        Join<Application, Job> jobJoin,
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Map<String, List<?>> dynamicFilters
    ) {
        List<Predicate> predicates = new ArrayList<>();

        predicates.add(cb.equal(jobJoin.get(Job_.RESEARCH_GROUP).get(ResearchGroup_.RESEARCH_GROUP_ID), researchGroupId));

        if (states != null && !states.isEmpty()) {
            predicates.add(root.get(Application_.STATE).in(states));
        }

        predicates.addAll(CriteriaUtils.buildDynamicFilters(cb, root, dynamicFilters));

        return predicates;
    }
}
