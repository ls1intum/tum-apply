package de.tum.cit.aet.evaluation.repository.specification;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public class ApplicationEvaluationSpecification {

    private static Specification<Application> forResearchGroup(UUID researchGroupId) {
        return (root, q, cb) -> cb.equal(root.join("job").join("researchGroup").get("researchGroupId"), researchGroupId);
    }

    private static Specification<Application> inStates(Collection<ApplicationState> states) {
        return (root, q, cb) -> root.get("state").in(states);
    }

    public static Specification<Application> build(UUID researchGroupId, Collection<ApplicationState> states) {
        return Specification.where(forResearchGroup(researchGroupId)).and(inStates(states));
    }
}
