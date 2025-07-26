package de.tum.cit.aet.job.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.notification.Email;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.EmailService;
import de.tum.cit.aet.core.util.PageUtil;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.*;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final EmailService emailService;
    private final ApplicationRepository applicationRepository;

    public JobService(
        JobRepository jobRepository,
        UserRepository userRepository,
        ApplicationRepository applicationRepository,
        EmailService emailService,
        CurrentUserService currentUserService
    ) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.emailService = emailService;
        this.currentUserService = currentUserService;
    }

    /**
     * Creates a new job using the provided job form data.
     *
     * @param dto the job details used to create the job
     * @return the created job as a {@link JobFormDTO}
     */
    public JobFormDTO createJob(JobFormDTO dto) {
        Job job = new Job();
        return updateJobEntity(job, dto);
    }

    /**
     * Updates an existing job with the new form data.
     *
     * @param jobId the ID of the job to update
     * @param dto the {@link JobFormDTO} containing updated job details
     * @return the updated job as a {@link JobFormDTO}
     */
    public JobFormDTO updateJob(UUID jobId, JobFormDTO dto) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        return updateJobEntity(job, dto);
    }

    /**
     * Changes the state of a job to the specified target state.
     * If the job is being closed or if explicitly requested, all pending application states
     * (i.e., in 'SAVED', 'SENT' or 'IN_REVIEW' state) for the job will be automatically updated.
     *
     * @param jobId the ID of the job whose state is to be changed
     * @param targetState the new {@link JobState} to apply to the job
     * @param shouldRejectRemainingApplications flag indicating whether remaining pending applications should be rejected
     * @return the updated job as a {@link JobFormDTO}
     */
    public JobFormDTO changeJobState(UUID jobId, JobState targetState, boolean shouldRejectRemainingApplications) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));

        job.setState(targetState);

        if (targetState == JobState.CLOSED) {
            // send emails stating that the job has been closed, to all applicants whose application was 'SENT' or 'IN_REVIEW'
            Set<Application> applicationsToNotify = applicationRepository.findApplicantsToNotify(jobId);
            String jobTitle = job.getTitle();
            String researchGroupName = job.getResearchGroup().getName();

            // update the state of all submitted and unsubmitted applications to 'JOB_CLOSED'
            applicationRepository.updateApplicationsForJob(jobId, targetState.getValue());

            notifyApplicants(applicationsToNotify, jobTitle, researchGroupName, RejectReason.JOB_OUTDATED);
        } else if (targetState == JobState.APPLICANT_FOUND && shouldRejectRemainingApplications) {
            // send rejection emails to all applicants whose application was 'SENT' or 'IN_REVIEW'
            Set<Application> applicationsToNotify = applicationRepository.findApplicantsToNotify(jobId);
            String jobTitle = job.getTitle();
            String researchGroupName = job.getResearchGroup().getName();

            // update the state of all submitted applications to 'REJECTED', all unsubmitted applications to 'JOB_CLOSED'
            applicationRepository.updateApplicationsForJob(jobId, targetState.getValue());

            notifyApplicants(applicationsToNotify, jobTitle, researchGroupName, RejectReason.JOB_FILLED);
        }

        return JobFormDTO.getFromEntity(jobRepository.save(job));
    }

    private void notifyApplicants(Set<Application> applications, String jobTitle, String researchGroupName, RejectReason reason) {
        for (Application application : applications) {
            Applicant applicant = application.getApplicant();
            Email email = Email.builder()
                .to(applicant)
                .emailType(EmailType.APPLICATION_REJECTED)
                .templateName(reason.getValue())
                .language(Language.fromCode(applicant.getSelectedLanguage()))
                .content(
                    Map.of(
                        "applicantFirstName",
                        applicant.getFirstName(),
                        "applicantLastName",
                        applicant.getLastName(),
                        "jobTitle",
                        jobTitle,
                        "researchGroupName",
                        researchGroupName,
                        "reason",
                        reason
                    )
                )
                .build();
            emailService.send(email);
        }
    }

    /**
     * Deletes a job posting by ID.
     *
     * @param jobId the ID of the job to delete
     */
    public void deleteJob(UUID jobId) {
        try {
            jobRepository.deleteById(jobId);
        } catch (Exception e) {
            throw EntityNotFoundException.forId("Job", jobId);
        }
    }

    /**
     * Returns a jobDTO given the job id.
     *
     * @param jobId the ID of the job
     * @return the job DTO with generaL job information
     */
    public JobDTO getJobById(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        return new JobDTO(
            job.getJobId(),
            job.getTitle(),
            job.getResearchArea(),
            job.getFieldOfStudies(),
            job.getSupervisingProfessor().getUserId(),
            job.getLocation(),
            job.getStartDate(),
            job.getWorkload(),
            job.getContractDuration(),
            job.getFundingType(),
            job.getDescription(),
            job.getTasks(),
            job.getRequirements(),
            job.getState()
        );
    }

    /**
     * Returns a jobDetailDTO given the job id.
     *
     * @param jobId the ID of the job
     * @return the job detail DTO with detailed job information
     */
    public JobDetailDTO getJobDetails(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));

        return new JobDetailDTO(
            job.getJobId(),
            job.getSupervisingProfessor().getFirstName() + " " + job.getSupervisingProfessor().getLastName(),
            job.getSupervisingProfessor().getResearchGroup(),
            job.getTitle(),
            job.getFieldOfStudies(),
            job.getResearchArea(),
            job.getLocation(),
            job.getWorkload(),
            job.getContractDuration(),
            job.getFundingType(),
            job.getDescription(),
            job.getTasks(),
            job.getRequirements(),
            job.getStartDate(),
            job.getCreatedAt(),
            job.getLastModifiedAt(),
            job.getState()
        );
    }

    /**
     * Returns a paginated list of all available (PUBLISHED) jobs.
     * Supports filtering by multiple fields and dynamic sorting, including manual sort for professor name.
     *
     * @param pageDTO pagination configuration
     * @param availableJobsFilterDTO DTO containing all optionally filterable fields
     * @param sortDTO sort configuration (by field and direction)
     * @return a page of {@link JobCardDTO} matching the criteria
     */
    public Page<JobCardDTO> getAvailableJobs(PageDTO pageDTO, AvailableJobsFilterDTO availableJobsFilterDTO, SortDTO sortDTO) {
        Pageable pageable;
        if (sortDTO.sortBy() != null && sortDTO.sortBy().equals("professorName")) {
            // Use pageable without sort: Sorting will be handled manually in @Query
            pageable = PageUtil.createPageRequest(pageDTO, null, null, false);
            return jobRepository.findAllJobCardsByState(
                JobState.PUBLISHED,
                availableJobsFilterDTO.title(), // optional filter for job title
                availableJobsFilterDTO.fieldOfStudies(), // optional filter for field of studies
                availableJobsFilterDTO.location(), // optional filter for campus location
                availableJobsFilterDTO.professorName(), // optional filter for supervising professor's full name
                availableJobsFilterDTO.workload(), // optional filter for workload value
                sortDTO.sortBy(),
                sortDTO.direction().name(),
                pageable
            );
        } else {
            // Sort dynamically via Pageable
            pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.AVAILABLE_JOBS, true);
            return jobRepository.findAllJobCardsByState(
                JobState.PUBLISHED,
                availableJobsFilterDTO.title(), // optional filter for job title
                availableJobsFilterDTO.fieldOfStudies(), // optional filter for field of studies
                availableJobsFilterDTO.location(), // optional filter for campus location
                availableJobsFilterDTO.professorName(), // optional filter for supervising professor's full name
                availableJobsFilterDTO.workload(), // optional filter for workload value
                pageable
            );
        }
    }

    /**
     * Returns a paginated list of jobs created by a given professor.
     * Supports optional filtering and dynamic sorting.
     *
     * @param pageDTO pagination configuration
     * @param professorJobsFilterDTO DTO containing all optionally filterable fields
     * @param sortDTO sorting configuration
     * @return a page of {@link CreatedJobDTO} for the professor's jobs
     */
    public Page<CreatedJobDTO> getJobsByProfessor(PageDTO pageDTO, ProfessorJobsFilterDTO professorJobsFilterDTO, SortDTO sortDTO) {
        UUID userId = currentUserService.getUserId();
        Pageable pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.PROFESSOR_JOBS, true);
        return jobRepository.findAllJobsByProfessor(userId, professorJobsFilterDTO.title(), professorJobsFilterDTO.state(), pageable);
    }

    private JobFormDTO updateJobEntity(Job job, JobFormDTO dto) {
        User supervisingProfessor = userRepository.findByIdElseThrow(dto.supervisingProfessor());
        job.setSupervisingProfessor(supervisingProfessor);
        job.setResearchGroup(supervisingProfessor.getResearchGroup());
        job.setTitle(dto.title());
        job.setResearchArea(dto.researchArea());
        job.setFieldOfStudies(dto.fieldOfStudies());
        job.setLocation(dto.location());
        job.setStartDate(dto.startDate());
        job.setWorkload(dto.workload());
        job.setContractDuration(dto.contractDuration());
        job.setFundingType(dto.fundingType());
        job.setDescription(dto.description());
        job.setTasks(dto.tasks());
        job.setRequirements(dto.requirements());
        job.setState(dto.state());
        Job createdJob = jobRepository.save(job);
        return JobFormDTO.getFromEntity(createdJob);
    }
}
