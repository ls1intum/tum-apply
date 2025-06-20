package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.dto.JobFilterOptionDTO;
import de.tum.cit.aet.job.domain.Job;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;

public interface JobEvaluationRepository extends TumApplyJpaRepository<Job, UUID> {
    @Query(
        """
            SELECT new de.tum.cit.aet.evaluation.dto.JobFilterOptionDTO(
                j.title,
                j.jobId
            )
            FROM Job j
            WHERE j.researchGroup.researchGroupId = :researchGroupId
        """
    )
    Set<JobFilterOptionDTO> findAllBYResearchGroup(UUID researchGroupId);
}
