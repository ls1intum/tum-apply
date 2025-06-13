package de.tum.cit.aet.evaluation.repository.impl;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.Application_;
import de.tum.cit.aet.core.util.CriteriaUtils;
import de.tum.cit.aet.core.util.SqlQueryUtil;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewDTO;
import de.tum.cit.aet.evaluation.repository.custom.ApplicationEvaluationRepositoryCustom;
import de.tum.cit.aet.job.domain.Job_;
import de.tum.cit.aet.usermanagement.domain.Applicant_;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup_;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.criteria.*;
import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
public class ApplicationEvaluationRepositoryImpl implements ApplicationEvaluationRepositoryCustom {

    //TODO add filter columns
    private static final Map<String, String> FILTER_COLUMNS = Map.of();

    private static final Map<String, String> SORT_COLUMNS = Map.ofEntries(
        Map.entry("rating", "a.rating"),
        Map.entry("createdAt", "a.created_at"),
        Map.entry("applicant.lastName", "ap_last_name"),
        Map.entry("state", "a.state")
    );

    @PersistenceContext
    private EntityManager em;

    /**
     * Retrieves a paginated list of application evaluations as DTOs based on the provided
     * research group ID, application states, and pagination settings.
     *
     * @param researchGroupId the ID of the research group to filter applications by
     * @param states          the collection of {@link ApplicationState} to include
     * @param pageable        the {@link Pageable} object containing pagination and sorting information
     * @return a {@link Page} of {@link ApplicationEvaluationOverviewDTO} matching the given criteria
     */
    @Override
    public List<ApplicationEvaluationOverviewDTO> findApplications(
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Pageable pageable,
        Map<String, List<?>> dynamicFilters
    ) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<ApplicationEvaluationOverviewDTO> query = cb.createQuery(ApplicationEvaluationOverviewDTO.class);

        QueryComponents components = buildQueryComponents(cb, query, researchGroupId, states, dynamicFilters);
        Root<Application> root = components.root;
        Join<?, ?> applicant = root.join(Application_.APPLICANT);

        query.where(components.predicates.toArray(new Predicate[0]));
        query.select(
            cb.construct(
                ApplicationEvaluationOverviewDTO.class,
                root.get(Application_.APPLICATION_ID),
                applicant.get(Applicant_.AVATAR),
                cb.concat(cb.concat(applicant.get(Applicant_.FIRST_NAME), " "), applicant.get(Applicant_.LAST_NAME)),
                root.get(Application_.STATE),
                root.get(Application_.JOB).get(Job_.TITLE),
                root.get(Application_.RATING),
                root.get(Application_.CREATED_AT)
            )
        );

        if (pageable.getSort().isSorted()) {
            query.orderBy(CriteriaUtils.buildSortOrders(cb, root, pageable.getSort(), Application_.APPLICATION_ID));
        }

        return em.createQuery(query).setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize()).getResultList();
    }

    @Override
    public long countApplications(UUID researchGroupId, Collection<ApplicationState> states, Map<String, List<?>> dynamicFilters) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);

        QueryComponents components = buildQueryComponents(cb, countQuery, researchGroupId, states, dynamicFilters);

        countQuery.select(cb.count(components.root)).where(components.predicates.toArray(new Predicate[0]));
        return em.createQuery(countQuery).getSingleResult();
    }

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
     * Builds a list of {@link Predicate} objects used to filter applications based on
     * research group ID and application states.
     *
     * @param cb                the {@link CriteriaBuilder} to construct predicates
     * @param root              the root of the {@link Application} entity
     * @param researchGroupPath the path to the associated {@code ResearchGroup} entity
     * @param researchGroupId   the ID of the research group to filter by
     * @param states            the collection of application states to include
     * @return a list of constructed predicates
     */
    private List<Predicate> buildPredicates(
        CriteriaBuilder cb,
        Root<Application> root,
        Path<?> researchGroupPath,
        UUID researchGroupId,
        Collection<ApplicationState> states
    ) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(researchGroupPath.get(ResearchGroup_.RESEARCH_GROUP_ID), researchGroupId));
        if (states != null && !states.isEmpty()) {
            predicates.add(root.get(Application_.STATE).in(states));
        }
        return predicates;
    }

    private QueryComponents buildQueryComponents(
        CriteriaBuilder cb,
        CriteriaQuery<?> query,
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Map<String, List<?>> dynamicFilters
    ) {
        Root<Application> root = query.from(Application.class);
        Join<?, ?> job = root.join(Application_.JOB);
        Join<?, ?> researchGroup = job.join(Job_.RESEARCH_GROUP);

        List<Predicate> predicates = buildPredicates(cb, root, researchGroup, researchGroupId, states);
        predicates.addAll(CriteriaUtils.buildDynamicFilters(cb, root, dynamicFilters));

        return new QueryComponents(root, researchGroup, predicates);
    }

    private static class QueryComponents {

        Root<Application> root;
        Join<?, ?> researchGroup;
        List<Predicate> predicates;

        QueryComponents(Root<Application> root, Join<?, ?> researchGroup, List<Predicate> predicates) {
            this.root = root;
            this.researchGroup = researchGroup;
            this.predicates = predicates;
        }
    }
}
