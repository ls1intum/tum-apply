package de.tum.cit.aet.evaluation.repository.impl;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.core.util.SqlQueryUtil;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewDTO;
import de.tum.cit.aet.evaluation.repository.custom.ApplicationEvaluationRepositoryCustom;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

@Repository
public class ApplicationEvaluationRepositoryImpl implements ApplicationEvaluationRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    //TODO add filter columns
    private static final Map<String, String> FILTER_COLUMNS = Map.of();

    private static final Map<String, String> SORT_COLUMNS = Map.ofEntries(
        Map.entry("rating", "a.rating"),
        Map.entry("createdAt", "a.created_at"),
        Map.entry("applicant.lastName", "ap_last_name"),
        Map.entry("state", "a.state")
    );

    private <T> List<T> findApplicationsGeneric() {
        return null;
    }

    @Override
    public List<ApplicationEvaluationOverviewDTO> findApplications(
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Pageable pageable,
        Map<String, List<?>> dynamicFilters
    ) {
        return null;
    }

    @Override
    public List<ApplicationForApplicantDTO> findApplicationDetails(
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Pageable pageable,
        Map<String, List<?>> dynamicFilters
    ) {
        return null;
    }

    @Override
    public long countApplications(UUID researchGroupId, Collection<ApplicationState> states, Map<String, List<?>> dynamicFilters) {
        return 0L;
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
}
