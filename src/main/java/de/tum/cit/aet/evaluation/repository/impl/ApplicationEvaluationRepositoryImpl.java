package de.tum.cit.aet.evaluation.repository.impl;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.Application_;
import de.tum.cit.aet.core.util.CriteriaUtils;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewDTO;
import de.tum.cit.aet.evaluation.repository.custom.ApplicationEvaluationRepositoryCustom;
import de.tum.cit.aet.job.domain.Job_;
import de.tum.cit.aet.usermanagement.domain.Applicant_;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup_;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public class ApplicationEvaluationRepositoryImpl implements ApplicationEvaluationRepositoryCustom {

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
    public Page<ApplicationEvaluationOverviewDTO> findApplications(
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Pageable pageable
    ) {
        CriteriaBuilder cb = em.getCriteriaBuilder();

        //Main Query
        CriteriaQuery<ApplicationEvaluationOverviewDTO> query = cb.createQuery(ApplicationEvaluationOverviewDTO.class);
        Root<Application> root = query.from(Application.class);
        Join<?, ?> applicant = root.join(Application_.APPLICANT);
        Join<?, ?> job = root.join(Application_.JOB);
        Join<?, ?> researchGroup = job.join(Job_.RESEARCH_GROUP);

        List<Predicate> predicates = buildPredicates(cb, root, researchGroup, researchGroupId, states);
        query.where(predicates.toArray(new Predicate[0]));

        query.select(
            cb.construct(
                ApplicationEvaluationOverviewDTO.class,
                root.get(Application_.APPLICATION_ID),
                applicant.get(Applicant_.AVATAR),
                cb.concat(cb.concat(applicant.get(Applicant_.FIRST_NAME), " "), applicant.get(Applicant_.LAST_NAME)),
                root.get(Application_.STATE),
                job.get(Job_.TITLE),
                root.get(Application_.RATING),
                root.get(Application_.CREATED_AT)
            )
        );

        if (pageable.getSort().isSorted()) {
            query.orderBy(CriteriaUtils.buildSortOrders(cb, root, pageable.getSort()));
        }

        List<ApplicationEvaluationOverviewDTO> results = em
            .createQuery(query)
            .setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize())
            .getResultList();

        //Count Query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Application> countRoot = countQuery.from(Application.class);
        Join<?, ?> countJob = countRoot.join(Application_.JOB);
        Join<?, ?> countRG = countJob.join(Job_.RESEARCH_GROUP);

        List<Predicate> countPredicates = buildPredicates(cb, countRoot, countRG, researchGroupId, states);
        countQuery.select(cb.count(countRoot)).where(countPredicates.toArray(new Predicate[0]));

        Long total = em.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(results, pageable, total);
    }

    /**
     * Builds a list of {@link Predicate} objects used to filter applications based on
     * research group ID and application states.
     *
     * @param cb               the {@link CriteriaBuilder} to construct predicates
     * @param root             the root of the {@link Application} entity
     * @param researchGroupPath the path to the associated {@code ResearchGroup} entity
     * @param researchGroupId  the ID of the research group to filter by
     * @param states           the collection of application states to include
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
}
