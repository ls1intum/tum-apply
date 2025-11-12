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
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class ApplicationEntityRepositoryImpl implements ApplicationEntityRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Finds all applications for a specific applicant with pagination and sorting
     * support.
     *
     * @param applicantId the UUID of the applicant
     * @param pageable    pagination and sorting parameters. Supported sort
     *                    property:
     *                    <ul>
     *                    <li>{@code createdAt} - sorts by creation date
     *                    (default)</li>
     *                    </ul>
     * @return a paginated list of application overview DTOs
     */
    @Override
    public Page<ApplicationOverviewDTO> findApplicationsByApplicant(UUID applicantId, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ApplicationOverviewDTO> cq = cb.createQuery(ApplicationOverviewDTO.class);
        Root<Application> application = cq.from(Application.class);
        Join<Application, Job> job = application.join(Application_.job);
        Join<Job, ResearchGroup> researchGroup = job.join(Job_.researchGroup);

        cq.select(
            cb.construct(
                ApplicationOverviewDTO.class,
                application.get(Application_.applicationId),
                job.get(Job_.jobId),
                job.get(Job_.title),
                researchGroup.get(ResearchGroup_.name),
                application.get(Application_.state),
                application.get(Application_.createdAt)
            )
        );

        cq.where(cb.equal(application.get(Application_.applicant).get(Applicant_.userId), applicantId));

        List<Order> orders = new ArrayList<>();
        if (pageable.getSort().isSorted()) {
            for (Sort.Order sortOrder : pageable.getSort()) {
                String property = sortOrder.getProperty();
                boolean ascending = sortOrder.isAscending();

                Expression<?> sortExpression = switch (property) {
                    // TODO: add additional support to sort for more fields here, like this:
                    // case "job.title" -> job.get(Job_.title);
                    // case "job.researchGroup.name" -> researchGroup.get(ResearchGroup_.name);
                    // case "state" -> application.get(Application_.state);
                    default -> application.get(Application_.createdAt);
                };

                Order order = ascending ? cb.asc(sortExpression) : cb.desc(sortExpression);
                orders.add(order);
            }
        }
        cq.orderBy(orders);

        TypedQuery<ApplicationOverviewDTO> query = entityManager.createQuery(cq);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<ApplicationOverviewDTO> results = query.getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Application> countRoot = countQuery.from(Application.class);
        countQuery.select(cb.count(countRoot));
        countQuery.where(cb.equal(countRoot.get(Application_.applicant).get(Applicant_.userId), applicantId));
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(results, pageable, total);
    }
}
