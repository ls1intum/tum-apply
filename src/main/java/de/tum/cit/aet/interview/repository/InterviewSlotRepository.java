package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.usermanagement.domain.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
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
     * @return a list of {@link InterviewSlot} entities associated with the given process
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
     */
    long countByInterviewProcessId(UUID processId);

    /**
     * Checks if a professor has any conflicting slots within the given time range.
     *
     * @param professor the professor to check
     * @param startDateTime start of the time range
     * @param endDateTime end of the time range
     * @return true if at least one conflicting slot exists, false otherwise
     */
    @Query(
        """
        SELECT COUNT(s) > 0 FROM InterviewSlot s
        JOIN s.interviewProcess ip
        JOIN ip.job j
        WHERE j.supervisingProfessor = :professor
        AND (s.startDateTime < :endDateTime AND s.endDateTime > :startDateTime)
        """
    )
    boolean hasConflictingSlots(
        @Param("professor") User professor,
        @Param("startDateTime") Instant startDateTime,
        @Param("endDateTime") Instant endDateTime
    );

    @Query(
        """
            SELECT slot
            FROM InterviewSlot slot
            JOIN slot.interviewProcess process
            JOIN process.job job
            WHERE job.supervisingProfessor = :professor
              AND slot.startDateTime < :endTime
              AND slot.endDateTime > :startTime
            ORDER BY slot.startDateTime ASC
            LIMIT 1
        """
    )
    Optional<InterviewSlot> findFirstConflictingSlot(
        @Param("professor") User professor,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );
}
