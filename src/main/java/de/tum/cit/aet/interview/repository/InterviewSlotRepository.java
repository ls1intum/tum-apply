package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.usermanagement.domain.User;
import java.time.Instant;
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
     * Retrieves all interview slots belonging to a given interview process,
     * ordered chronologically by their start date and time.
     *
     * @param processId the ID of the interview process
     * @return a list of {@link InterviewSlot} entities associated with the given process,
     *         ordered by start date and time
     * @return a list of {@link InterviewSlot} entities sorted by start time
     */
    @Query("SELECT s FROM InterviewSlot s WHERE s.interviewProcess.id = :processId ORDER BY s.startDateTime")
    List<InterviewSlot> findByInterviewProcessIdOrderByStartDateTime(@Param("processId") UUID processId);

    /**
     * Counts all interview slots associated with a specific interview process.
     * Finds all interview slots of a given professor that overlap with a specified time range.
     * This is used to check for scheduling conflicts when creating or updating interview slots.
     *
     * @param processId the ID of the interview process
     * @return the number of slots linked to the given process
     * @return a list of {@link InterviewSlot} entities that overlap with the given time range
     */
    long countByInterviewProcessId(UUID processId);

    @Query(
        """
        SELECT s FROM InterviewSlot s
        JOIN FETCH s.interviewProcess ip
        JOIN FETCH ip.job j
        JOIN FETCH j.supervisingProfessor p
        WHERE p = :professor
        AND (s.startDateTime < :endDateTime AND s.endDateTime > :startDateTime)
        """
    )
    List<InterviewSlot> findConflictingSlotsForProfessor(
        @Param("professor") User professor,
        @Param("startDateTime") Instant startDateTime,
        @Param("endDateTime") Instant endDateTime
    );
}
