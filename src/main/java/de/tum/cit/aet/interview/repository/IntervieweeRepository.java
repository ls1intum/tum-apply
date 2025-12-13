package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.Interviewee;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IntervieweeRepository extends JpaRepository<Interviewee, UUID> {
    /**
     * Checks if an interviewee already exists for the given application and interview process.
     *
     * @param application the application to check
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
}
