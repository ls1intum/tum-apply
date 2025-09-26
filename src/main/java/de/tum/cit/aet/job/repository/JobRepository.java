package de.tum.cit.aet.job.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.CreatedJobDTO;
import de.tum.cit.aet.job.dto.JobCardDTO;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface JobRepository extends TumApplyJpaRepository<Job, UUID> {
    /**
     * Finds all jobs created by a specific professor, filtered optionally by title
     * and job state.
     * Results are paginated.
     *
     * @param userId   the ID of the professor (user)
     * @param title    a partial match filter for job title (nullable)
     * @param state    the state of the job (nullable)
     * @param pageable pagination and sorting information
     * @return a page of {@link CreatedJobDTO} matching the criteria
     */
    @Query("""
                SELECT new de.tum.cit.aet.job.dto.CreatedJobDTO(
                    j.jobId,
                    j.supervisingProfessor.avatar,
                    CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                    j.state,
                    j.title,
                    j.startDate,
                    j.createdAt,
                    j.lastModifiedAt
                )
                FROM Job j
                WHERE j.supervisingProfessor.userId = :userId
                AND (:title IS NULL OR j.title LIKE %:title%)
                AND (:state IS NULL OR j.state = :state)
            """)
    Page<CreatedJobDTO> findAllJobsByProfessor(
            @Param("userId") UUID userId,
            @Param("title") String title,
            @Param("state") JobState state,
            Pageable pageable);

  /**
   * Finds all available job postings with optional filtering and custom sorting
   * by professor name.
   * Sorting is applied manually for the computed professor name field.
   *
   * @param state          the job state (typically PUBLISHED)
   * @param titles         a partial match filter for multiple job title
   *                       (nullable)
   * @param fieldOfStudies a partial match filter for multiple field of studies
   *                       (nullable)
   * @param locations      the campus locations filter (nullable)
   * @param professorNames a partial match filter for multiple professor's full
   *                       names
   *                       (nullable)
   * @param workload       filter for the job workload (nullable)
   * @param sortBy         the field to sort by (only used for professorName
   *                       sorting here)
   * @param sortDirection  sort direction (ASC or DESC)
   * @param userId         id of the currently logged in user (nullable)
   * @param searchQuery    string to search for job title, field of
   *                       studies or supervisor name
   * @param pageable       pagination information
   * @return a page of {@link JobCardDTO} matching the criteria
   */
  @Query("""
      SELECT new de.tum.cit.aet.job.dto.JobCardDTO(
        j.jobId as jobId,
        j.title as title,
        j.fieldOfStudies as fieldOfStudies,
        j.location as location,
        CONCAT(p.firstName, ' ', p.lastName) as professorName,
        a.applicationId as applicationId,
        a.state as applicationState,
        j.workload as workload,
        j.startDate as startDate,
        j.endDate as endDate
      )
      FROM Job j
      JOIN j.supervisingProfessor p
      LEFT JOIN j.applications a
             WITH (:userId IS NOT NULL
               AND a.applicant.userId = :userId
               AND a.createdAt = (
                    SELECT MAX(a2.createdAt)
                    FROM Application a2
                    WHERE a2.job = j AND a2.applicant.userId = :userId
               ))
      WHERE j.state = :state
        AND (j.endDate IS NULL OR j.endDate >= CURRENT_DATE)
        AND (:titles IS NULL OR j.title IN :titles)
        AND (:fieldOfStudies IS NULL OR j.fieldOfStudies IN :fieldOfStudies)
        AND (:locations IS NULL OR j.location IN :locations)
        AND (:professorNames IS NULL OR CONCAT(p.firstName, ' ', p.lastName) IN :professorNames)
        AND (:searchQuery IS NULL OR
           UPPER(j.title) LIKE UPPER(CONCAT('%', TRIM(:searchQuery), '%')) OR
           UPPER(j.fieldOfStudies) LIKE UPPER(CONCAT('%', TRIM(:searchQuery), '%')) OR
           UPPER(CONCAT(p.firstName, ' ', p.lastName)) LIKE UPPER(CONCAT('%', TRIM(:searchQuery), '%'))
      )
                ORDER BY
                    CASE WHEN :sortDirection = 'ASC'  AND :sortBy = 'professorName' THEN CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName) END ASC,
                    CASE WHEN :sortDirection = 'DESC' AND :sortBy = 'professorName' THEN CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName) END DESC,
                    j.createdAt DESC
                """)
  Page<JobCardDTO> findAllJobCardsByState(
      @Param("state") JobState state,
      @Param("titles") List<String> titles,
      @Param("fieldOfStudies") List<String> fieldOfStudies,
      @Param("locations") List<Campus> locations,
      @Param("professorNames") List<String> professorNames,
      @Param("sortBy") String sortBy,
      @Param("sortDirection") String sortDirection,
      @Param("userId") UUID userId,
      @Param("searchQuery") String searchQuery,
      Pageable pageable);

  /**
   * Finds all available job postings with optional filtering options. Sorting is
   * delegated to Spring's Pageable,
   * so this method does not support custom sorting by computed fields like
   * professor name.
   *
   * @param state          the job state (typically PUBLISHED)
   * @param titles         a partial match filter for multiple job title
   *                       (nullable)
   * @param fieldOfStudies a partial match filter for multiple field of studies
   *                       (nullable)
   * @param locations      the campus locations filter (nullable)
   * @param professorNames a partial match filter for multiple professor's full
   *                       names
   *                       (nullable)
   * @param workload       filter for the job workload (nullable)
   * @param userId         id of the currently logged in user (nullable)
   * @param searchQuery    string to search for job title, field of
   *                       studies or supervisor name
   * @param pageable       pagination and sorting information
   * @return a page of {@link JobCardDTO} matching the criteria
   */
  @Query("""
        SELECT new de.tum.cit.aet.job.dto.JobCardDTO(
          j.jobId as jobId,
          j.title as title,
          j.fieldOfStudies as fieldOfStudies,
          j.location as location,
          CONCAT(p.firstName, ' ', p.lastName) as professorName,
          a.applicationId as applicationId,
          a.state as applicationState,
          j.workload as workload,
          j.startDate as startDate,
          j.endDate as endDate
        )
        FROM Job j
        JOIN j.supervisingProfessor p
        LEFT JOIN j.applications a
               WITH (:userId IS NOT NULL
                 AND a.applicant.userId = :userId
                 AND a.createdAt = (
                      SELECT MAX(a2.createdAt)
                      FROM Application a2
                      WHERE a2.job = j AND a2.applicant.userId = :userId
                 ))
        WHERE j.state = :state
          AND (j.endDate IS NULL OR j.endDate >= CURRENT_DATE)
          AND (:titles IS NULL OR j.title IN :titles)
          AND (:fieldOfStudies IS NULL OR j.fieldOfStudies IN :fieldOfStudies)
          AND (:locations IS NULL OR j.location IN :locations)
          AND (:professorNames IS NULL OR CONCAT(p.firstName, ' ', p.lastName) IN :professorNames)
          AND (:searchQuery IS NULL OR
             UPPER(j.title) LIKE UPPER(CONCAT('%', TRIM(:searchQuery), '%')) OR
             UPPER(j.fieldOfStudies) LIKE UPPER(CONCAT('%', TRIM(:searchQuery), '%')) OR
             UPPER(CONCAT(p.firstName, ' ', p.lastName)) LIKE UPPER(CONCAT('%', TRIM(:searchQuery), '%'))
          )
      """)
  Page<JobCardDTO> findAllJobCardsByState(
      @Param("state") JobState state,
      @Param("titles") List<String> titles,
      @Param("fieldOfStudies") List<String> fieldOfStudies,
      @Param("locations") List<Campus> locations,
      @Param("professorNames") List<String> professorNames,
      @Param("userId") UUID userId,
      @Param("searchQuery") String searchQuery,
      Pageable pageable);

  /**
   * Finds all available job names
   *
   * @param state the job state (typically PUBLISHED)
   * @return a List of String with all unique, available job names
   */
  @Query("""
      SELECT DISTINCT j.title
      FROM Job j
      WHERE j.state = :state
        AND (j.endDate IS NULL OR j.endDate >= CURRENT_DATE)
      ORDER BY j.title ASC
      """)
  List<String> findAllUniqueJobNames(@Param("state") JobState state);

  /**
   * Finds all available fields of study
   *
   * @param state the job state (typically PUBLISHED)
   * @return a List of String with all unique, available fields of study
   */
  @Query("""
      SELECT DISTINCT j.fieldOfStudies
      FROM Job j
      WHERE j.state = :state
        AND (j.endDate IS NULL OR j.endDate >= CURRENT_DATE)
      ORDER BY j.fieldOfStudies ASC
      """)
  List<String> findAllUniqueFieldOfStudies(@Param("state") JobState state);

  /**
   * Finds all unique supervisor names
   *
   * @param state the job state (typically PUBLISHED)
   * @return a List of String with all unique, available supervisor names
   */
  @Query("""
      SELECT DISTINCT CONCAT(p.firstName, ' ', p.lastName)
      FROM Job j
      JOIN j.supervisingProfessor p
      WHERE j.state = :state
        AND (j.endDate IS NULL OR j.endDate >= CURRENT_DATE)
      ORDER BY CONCAT(p.firstName, ' ', p.lastName) ASC
      """)
  List<String> findAllUniqueSupervisorNames(@Param("state") JobState state);

}
