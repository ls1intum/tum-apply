package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.Interviewee;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IntervieweeRepository extends TumApplyJpaRepository<Interviewee, UUID> {
    /**
     * Checks if an interviewee already exists for the given application and
     * interview process.
     *
     * @param application      the application to check
     * @param interviewProcess the interview process to check
     * @return true if an interviewee already exists
     */
    boolean existsByApplicationAndInterviewProcess(Application application, InterviewProcess interviewProcess);

    /**
     * Finds all interviewees for a given interview process.
     *
     * @param processId the ID of the interview process
     * @return list of interviewees ordered by creation date
     */
    @Query(
        """
        SELECT DISTINCT i FROM Interviewee i
        LEFT JOIN FETCH i.application a
        LEFT JOIN FETCH a.applicant ap
        LEFT JOIN FETCH ap.user
        LEFT JOIN FETCH i.slots
        WHERE i.interviewProcess.id = :processId
        ORDER BY i.createdAt DESC
        """
    )
    List<Interviewee> findByInterviewProcessIdWithDetails(@Param("processId") UUID processId);

    /**
     * Counts the number of interviewees for a given interview process.
     *
     * @param processId the ID of the interview process
     * @return the count of interviewees
     */
    long countByInterviewProcessId(UUID processId);

    /**
     * Finds an interviewee by application ID and interview process ID.
     * Used when assigning an applicant to an interview slot.
     *
     * @param applicationId the ID of the application
     * @param processId     the ID of the interview process
     * @return Optional containing the interviewee if found
     */
    Optional<Interviewee> findByApplicationApplicationIdAndInterviewProcessId(UUID applicationId, UUID processId);

    /**
     * Finds an Interviewee by interview process ID and user ID.
     * Fetches slots to check if user already has a booked slot.
     *
     * @param processId the ID of the interview process
     * @param userId    the ID of the user (via application.applicant.user)
     * @return Optional containing the interviewee with slots if found
     */
    @Query(
        """
        SELECT i FROM Interviewee i
        LEFT JOIN FETCH i.slots
        WHERE i.interviewProcess.id = :processId
        AND i.application.applicant.user.userId = :userId
        """
    )
    Optional<Interviewee> findByProcessIdAndUserId(@Param("processId") UUID processId, @Param("userId") UUID userId);

    /**
     * Finds all interviewees for multiple interview processes with their slot data.
     * Used for efficient statistics calculation across all interview processes.
     *
     * @param processIds the IDs of the interview processes
     * @return list of interviewees with slot data
     */
    @Query(
        """
        SELECT i FROM Interviewee i
        LEFT JOIN FETCH i.slots
        WHERE i.interviewProcess.id IN :processIds
        """
    )
    List<Interviewee> findByInterviewProcessIdInWithSlots(@Param("processIds") List<UUID> processIds);

    /**
     * Finds a single interviewee by ID within a process.
     *
     * @param intervieweeId the ID of the interviewee
     * @param processId     the ID of the interview process
     * @return the interviewee or empty if not found
     */
    @Query(
        """
        SELECT DISTINCT i FROM Interviewee i
        JOIN FETCH i.interviewProcess ip
        JOIN FETCH ip.job j
        LEFT JOIN FETCH i.application a
        LEFT JOIN FETCH a.applicant ap
        LEFT JOIN FETCH ap.user
        LEFT JOIN FETCH i.slots
        WHERE i.id = :intervieweeId
        AND ip.id = :processId
        """
    )
    Optional<Interviewee> findByIdAndProcessId(@Param("intervieweeId") UUID intervieweeId, @Param("processId") UUID processId);

    /* Finds all uninvited interviewees for a given interview process.
     * Fetches application and user details to avoid N+1 issues when sending emails.
     *
     * @param processId the ID of the interview process
     * @return list of uninvited interviewees with user details
     */
    @EntityGraph(attributePaths = { "application.applicant.user" })
    List<Interviewee> findAllByInterviewProcessIdAndLastInvitedIsNull(UUID processId);
}
