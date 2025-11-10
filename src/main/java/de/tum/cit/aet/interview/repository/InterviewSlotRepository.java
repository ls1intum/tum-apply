package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for managing interview slots.
 */
@Repository
public interface InterviewSlotRepository extends JpaRepository<InterviewSlot, UUID> {

    /**
     * Find all slots for a given interview process, ordered by start time.
     */
    @Query("SELECT s FROM InterviewSlot s WHERE s.interviewProcess.id = :processId ORDER BY s.startDateTime")
    List<InterviewSlot> findByInterviewProcessIdOrderByStartDateTime(@Param("processId") UUID processId);

    /**
     * Count slots for a given interview process.
     */
    long countByInterviewProcessId(UUID processId);
}
