package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewSlot;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing interview slots.
 */
@Repository
public interface InterviewSlotRepository extends JpaRepository<InterviewSlot, UUID> {
    /**
     * Finds all interview slots for a given interview process, ordered by start time.
     *
     * @param processId the ID of the interview process
     * @return a list of {@link InterviewSlot} entities associated with the given process,
     *         ordered by start date and time
     */
    @Query("SELECT s FROM InterviewSlot s WHERE s.interviewProcess.id = :processId ORDER BY s.startDateTime")
    List<InterviewSlot> findByInterviewProcessIdOrderByStartDateTime(@Param("processId") UUID processId);

    /**
     * Counts all interview slots associated with a specific interview process.
     *
     * @param processId the ID of the interview process
     * @return the number of slots linked to the given process
     */
    long countByInterviewProcessId(UUID processId);
}
