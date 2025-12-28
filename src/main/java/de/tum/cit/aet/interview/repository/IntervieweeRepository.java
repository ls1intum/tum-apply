package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.Interviewee;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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
     * Finds a single interviewee by ID within a process.
     *
     * @param intervieweeId the ID of the interviewee
     * @param processId     the ID of the interview process
     * @return the interviewee or empty if not found
     */
    @Query(
        """
        SELECT i FROM Interviewee i
        JOIN FETCH i.interviewProcess ip
        JOIN FETCH ip.job j
        LEFT JOIN FETCH i.slots
        WHERE i.id = :intervieweeId
        AND ip.id = :processId
        """
    )
    Optional<Interviewee> findByIdAndProcessId(@Param("intervieweeId") UUID intervieweeId, @Param("processId") UUID processId);
}
