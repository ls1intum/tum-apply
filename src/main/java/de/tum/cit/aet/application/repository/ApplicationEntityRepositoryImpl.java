package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.Application_;
import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.domain.Job_;
import de.tum.cit.aet.usermanagement.domain.Applicant_;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup_;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import java.util.List;
import java.util.UUID;

public class ApplicationEntityRepositoryImpl implements ApplicationEntityRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<ApplicationOverviewDTO> findApplicationsByApplicant(UUID applicantId, int pageNumber, int pageSize) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ApplicationOverviewDTO> cq = cb.createQuery(ApplicationOverviewDTO.class);
        Root<Application> application = cq.from(Application.class);
        Join<Application, Job> job = application.join(Application_.job);
        Join<Job, ResearchGroup> researchGroup = job.join(Job_.researchGroup);

        cq.select(
            cb.construct(
                ApplicationOverviewDTO.class,
                application.get(Application_.applicationId),
                job.get(Job_.title),
                researchGroup.get(ResearchGroup_.name),
                application.get(Application_.state),
                application.get(Application_.createdAt)
            )
        );

        cq.where(cb.equal(application.get(Application_.applicant).get(Applicant_.userId), applicantId));
        cq.orderBy(cb.desc(application.get(Application_.createdAt)));

        TypedQuery<ApplicationOverviewDTO> query = entityManager.createQuery(cq);
        query.setFirstResult(pageNumber * pageSize);
        query.setMaxResults(pageSize);

        return query.getResultList();
    }
}
