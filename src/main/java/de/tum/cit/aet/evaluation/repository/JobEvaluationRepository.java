package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.dto.JobFilterOptionDTO;
import de.tum.cit.aet.job.domain.Job;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobEvaluationRepository extends TumApplyJpaRepository<Job, UUID> {
    /**
     * Finds all job filter options for the specified research group.
     *
     * @param researchGroupId the unique identifier of the research group
     * @return a set of {@link JobFilterOptionDTO} containing the title and ID of each matching job
     */
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
    Set<JobFilterOptionDTO> findAllByResearchGroup(@Param("researchGroupId") UUID researchGroupId);
}
