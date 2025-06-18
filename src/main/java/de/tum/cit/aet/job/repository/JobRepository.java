package de.tum.cit.aet.job.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.CreatedJobDTO;
import de.tum.cit.aet.job.dto.JobCardDTO;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface JobRepository extends TumApplyJpaRepository<Job, UUID> {
    @Query(
        """
            SELECT new de.tum.cit.aet.job.dto.CreatedJobDTO(
                j.jobId,
                j.supervisingProfessor.avatar,
                CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                j.state,
                j.title,
                j.startDate,
                j.createdAt,
                j.lastModifiedAt
            )
            FROM Job j
            WHERE j.supervisingProfessor.userId = :userId
            AND (:title IS NULL OR j.title LIKE :title)
            AND (:state IS NULL OR j.state = :state)
        """
    )
    Page<CreatedJobDTO> findAllJobsByProfessor(
        @Param("userId") UUID userId,
        @Param("title") String title,
        @Param("state") JobState state,
        Pageable pageable
    );

    @Query(
        """
            SELECT new de.tum.cit.aet.job.dto.JobCardDTO(
                j.jobId,
                j.title,
                j.fieldOfStudies,
                j.location,
                CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                j.workload,
                j.startDate,
                j.createdAt
            )
            FROM Job j
            WHERE j.state = :state
            AND (:title IS NULL OR j.title LIKE :title)
        """
    )
    Page<JobCardDTO> findAllJobCardsByState(@Param("state") JobState state, @Param("title") String title, Pageable pageable);
}
