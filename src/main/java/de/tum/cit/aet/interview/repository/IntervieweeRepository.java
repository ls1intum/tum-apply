package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.Interviewee;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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
        SELECT i FROM Interviewee i
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
     * Deletes interviewees for a given application id.
     *
     * @param applicationId the id of the application
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM Interviewee i WHERE i.application.applicationId = :applicationId")
    void deleteByApplicationId(@Param("applicationId") UUID applicationId);
}
