package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewSlot;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import de.tum.cit.aet.usermanagement.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing interview slots.
 */
@Repository
public interface InterviewSlotRepository extends JpaRepository<InterviewSlot, UUID> {

    @Query("SELECT s FROM InterviewSlot s WHERE s.interviewProcess.id = :processId ORDER BY s.startDateTime")
    List<InterviewSlot> findByInterviewProcessIdOrderByStartDateTime(@Param("processId") UUID processId);
    /**
     * Find all slots of a professor that overlap with the given time range.
     * Uses explicit joins and ID comparison for reliable conflict detection.
     */
    @Query("""
        SELECT s FROM InterviewSlot s
        JOIN s.interviewProcess ip
        JOIN ip.job j
        WHERE j.supervisingProfessor.userId = :professorId
        AND (s.startDateTime < :endDateTime AND s.endDateTime > :startDateTime)
        """)
    List<InterviewSlot> findConflictingSlotsForProfessor(
        @Param("professorId") UUID professorId,
        @Param("startDateTime") Instant startDateTime,
        @Param("endDateTime") Instant endDateTime
    );
}
