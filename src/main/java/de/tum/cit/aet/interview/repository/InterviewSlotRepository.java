package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.usermanagement.domain.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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
     * Finds all interview slots for a given interview process with pagination.
     * Results are ordered by start time ascending.
     *
     * @param processId the ID of the interview process
     * @param pageable  pagination information
     * @return a page of {@link InterviewSlot} entities
     */
    @EntityGraph(
        attributePaths = {
            "interviewee", "interviewee.application", "interviewee.application.applicant", "interviewee.application.applicant.user",
        }
    )
    @Query("SELECT s FROM InterviewSlot s WHERE s.interviewProcess.id = :processId ORDER BY s.startDateTime")
    Page<InterviewSlot> findByInterviewProcessId(@Param("processId") UUID processId, Pageable pageable);

    /**
     * Finds a slot by ID with job and research group.
     *
     * @param slotId the ID of the slot to find
     * @return Optional containing the slot with job loaded, or empty if not found
     */
    @EntityGraph(attributePaths = { "interviewProcess", "interviewProcess.job", "interviewProcess.job.researchGroup" })
    @Query("SELECT s FROM InterviewSlot s WHERE s.id = :slotId")
    Optional<InterviewSlot> findByIdWithJob(@Param("slotId") UUID slotId);

    /**
     * Counts all interview slots associated with a specific interview process.
     * Finds all interview slots of a given professor that overlap with a specified
     * time range.
     * This is used to check for scheduling conflicts when creating or updating
     * interview slots.
     *
     * @param processId the ID of the interview process
     * @return the number of slots linked to the given process
     */
    long countByInterviewProcessId(UUID processId);

    /**
     * Checks if a professor has any conflicting slots within the given time range.
     *
     * @param professor     the professor to check
     * @param startDateTime start of the time range
     * @param endDateTime   end of the time range
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

    /**
     * Checks if a slot exists and belongs to a specific professor.
     *
     * @param slotId      the ID of the slot
     * @param professorId the ID of the supervising professor
     * @return true if the slot exists and belongs to the professor
     */
    @Query(
        """
            SELECT COUNT(s) > 0
            FROM InterviewSlot s
            WHERE s.id = :slotId
              AND s.interviewProcess.job.supervisingProfessor.userId = :professorId
        """
    )
    boolean existsByIdAndSupervisingProfessorId(@Param("slotId") UUID slotId, @Param("professorId") UUID professorId);

    /**
     * Finds all interview slots for a given interview process within a specific
     * month.
     * Results are paginated and ordered by start time.
     *
     * @param processId  the ID of the interview process
     * @param monthStart the start of the month (inclusive)
     * @param monthEnd   the end of the month (exclusive)
     * @param pageable   pagination information
     * @return a page of {@link InterviewSlot} entities for the specified month
     */
    @EntityGraph(
        attributePaths = {
            "interviewee", "interviewee.application", "interviewee.application.applicant", "interviewee.application.applicant.user",
        }
    )
    @Query(
        """
        SELECT s FROM InterviewSlot s
        WHERE s.interviewProcess.id = :processId
        AND s.startDateTime >= :monthStart
        AND s.startDateTime < :monthEnd
        ORDER BY s.startDateTime
        """
    )
    Page<InterviewSlot> findByProcessIdAndMonth(
        @Param("processId") UUID processId,
        @Param("monthStart") Instant monthStart,
        @Param("monthEnd") Instant monthEnd,
        Pageable pageable
    );

    /**
     * Finds all unbooked, future interview slots for a given interview process.
     * Used for the applicant booking page to display available time slots.
     *
     * @param processId the ID of the interview process
     * @param now       the current timestamp to filter out past slots
     * @return list of available slots ordered by start time ascending
     */
    @Query(
        """
        SELECT s FROM InterviewSlot s
        WHERE s.interviewProcess.id = :processId
        AND s.isBooked = false
        AND s.startDateTime >= :now
        ORDER BY s.startDateTime ASC
        """
    )
    List<InterviewSlot> findAvailableSlotsByProcessId(@Param("processId") UUID processId, @Param("now") Instant now);

    /**
     * Finds all unbooked future interview slots for a given process within a
     * specific month.
     * Only returns slots that are both within the month AND in the future.
     * Used for server-side pagination on the applicant booking page.
     *
     * @param processId  the ID of the interview process
     * @param now        the current time (to filter out past slots)
     * @param monthStart the start of the month (inclusive)
     * @param monthEnd   the end of the month (exclusive)
     * @param pageable   pagination information
     * @return page of available future slots ordered by start time ascending
     */
    @Query(
        """
        SELECT s FROM InterviewSlot s
        WHERE s.interviewProcess.id = :processId
        AND s.isBooked = false
        AND s.startDateTime >= :now
        AND s.startDateTime >= :monthStart
        AND s.startDateTime < :monthEnd
        ORDER BY s.startDateTime ASC
        """
    )
    Page<InterviewSlot> findAvailableSlotsByProcessIdAndMonth(
        @Param("processId") UUID processId,
        @Param("now") Instant now,
        @Param("monthStart") Instant monthStart,
        @Param("monthEnd") Instant monthEnd,
        Pageable pageable
    );

    /**
     * Counts the number of availble (unbooked) future slots for a process.
     * Used to warn professors if they invite more applicants than available slots.
     *
     * @param processId the ID of the interview process
     * @param now       the current timestamp to filter out past slots
     * @return the count of available future slots
     */
    @Query(
        """
        SELECT COUNT(s) FROM InterviewSlot s
        WHERE s.interviewProcess.id = :processId
        AND s.startDateTime > :now
        AND s.isBooked = false
        """
    )
    long countFutureSlots(@Param("processId") UUID processId, @Param("now") Instant now);

    /**
     * Finds the first future slot for a given process.
     * Including booked slots (as we just want to know where to jump to).
     *
     * @param processId the ID of the interview process
     * @param now       the current timestamp
     * @param pageable  pagination (use PageRequest.of(0, 1))
     * @return page containing the first future slot
     */
    @Query(
        """
        SELECT s FROM InterviewSlot s
        WHERE s.interviewProcess.id = :processId
        AND s.startDateTime >= :now
        ORDER BY s.startDateTime ASC
        """
    )
    Page<InterviewSlot> findFutureSlots(@Param("processId") UUID processId, @Param("now") Instant now, Pageable pageable);
}
