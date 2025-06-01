package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@AllArgsConstructor
@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final JobRepository jobRepository;

    /**
     * Creates a new job application for the given applicant and job.
     * If an application already exists for the applicant and job, an exception is thrown.
     *
     * @param createApplicationDTO DTO containing application and applicant data
     * @return the created ApplicationForApplicantDTO
     * @throws OperationNotAllowedException if the applicant has already applied for the job
     */
    @Transactional
    public ApplicationForApplicantDTO createApplication(CreateApplicationDTO createApplicationDTO) {
        if (
            applicationRepository.existsByApplicantUserIdAndJobJobId(
                createApplicationDTO.applicant().user().userId(),
                createApplicationDTO.jobId()
            )
        ) {
            throw new OperationNotAllowedException("Applicant has already applied for this position");
        }
        Applicant applicant = applicantRepository.getReferenceById(UUID.fromString("00000000-0000-0000-0000-000000000104"));
        applicant.setFirstName(createApplicationDTO.applicant().user().firstName());
        applicant.setLastName(createApplicationDTO.applicant().user().lastName());
        applicant.setGender(createApplicationDTO.applicant().user().gender());
        applicant.setNationality(createApplicationDTO.applicant().user().nationality());
        applicant.setBirthday(createApplicationDTO.applicant().user().birthday());
        applicant.setPhoneNumber(createApplicationDTO.applicant().user().phoneNumber());
        applicant.setWebsite(createApplicationDTO.applicant().user().website());
        applicant.setLinkedinUrl(createApplicationDTO.applicant().user().linkedinUrl());
        if (createApplicationDTO.applicant().user().selectedLanguage() != null) {
            applicant.setSelectedLanguage(createApplicationDTO.applicant().user().selectedLanguage());
        }

        applicant.setStreet(createApplicationDTO.applicant().street());
        applicant.setPostalCode(createApplicationDTO.applicant().postalCode());
        applicant.setCity(createApplicationDTO.applicant().city());
        applicant.setCountry(createApplicationDTO.applicant().country());
        applicant.setBachelorDegreeName(createApplicationDTO.applicant().bachelorDegreeName());
        applicant.setBachelorGradingScale(createApplicationDTO.applicant().bachelorGradingScale());
        applicant.setBachelorGrade(createApplicationDTO.applicant().bachelorGrade());
        applicant.setBachelorUniversity(createApplicationDTO.applicant().bachelorUniversity());
        applicant.setMasterDegreeName(createApplicationDTO.applicant().masterDegreeName());
        applicant.setMasterGradingScale(createApplicationDTO.applicant().masterGradingScale());
        applicant.setMasterGrade(createApplicationDTO.applicant().masterGrade());
        applicant.setMasterUniversity(createApplicationDTO.applicant().masterUniversity());
        applicantRepository.save(applicant);

        Job job = jobRepository.getReferenceById(createApplicationDTO.jobId());
        Application application = new Application(
            null,
            null, // no applicationReview yet
            applicant,
            job,
            createApplicationDTO.applicationState(),
            createApplicationDTO.desiredDate(),
            null,
            null,
            null,
            null,
            createApplicationDTO.projects(),
            createApplicationDTO.specialSkills(),
            createApplicationDTO.motivation(),
            null,
            new HashSet<>(), // TODO get CustomAnswers from CustomAnswerDto,
            new HashSet<>()
        );
        Application savedApplication = applicationRepository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     * Retrieves all applications submitted by a specific applicant.
     *
     * @param applicantId the UUID of the applicant
     * @return a set of ApplicationForApplicantDTO for the given applicant
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfApplicant(UUID applicantId) {
        return applicationRepository.findAllDtosByApplicantUserId(applicantId);
    }

    /**
     * Retrieves all applications for a specific job.
     *
     * @param jobId the UUID of the job
     * @return a set of ApplicationForApplicantDTO for the given job
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfJob(UUID jobId) {
        return applicationRepository.findAllDtosByJobJobId(jobId);
    }

    /**
     * Retrieves an application by its ID.
     *
     * @param applicationId the UUID of the application
     * @return the ApplicationForApplicantDTO with the given ID
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        return applicationRepository.findDtoById(applicationId);
    }

    /**
     * Updates an existing application with new information.
     *
     * @param updateApplicationDTO DTO containing updated application data
     * @return the updated ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO updateApplication(UpdateApplicationDTO updateApplicationDTO) {
        applicationRepository.updateApplication(
            updateApplicationDTO.applicationId(),
            updateApplicationDTO.applicationState().name(),
            updateApplicationDTO.desiredDate(),
            updateApplicationDTO.projects(),
            updateApplicationDTO.specialSkills(),
            updateApplicationDTO.motivation()
        );
        ApplicantDTO applicantDTO = updateApplicationDTO.applicant();

        Applicant applicant = applicantRepository.getReferenceById(UUID.fromString("00000000-0000-0000-0000-000000000104"));
        applicant.setFirstName(applicantDTO.user().firstName());
        applicant.setLastName(applicantDTO.user().lastName());
        applicant.setGender(applicantDTO.user().gender());
        applicant.setNationality(applicantDTO.user().nationality());
        applicant.setBirthday(applicantDTO.user().birthday());
        applicant.setPhoneNumber(applicantDTO.user().phoneNumber());
        applicant.setWebsite(applicantDTO.user().website());
        applicant.setLinkedinUrl(applicantDTO.user().linkedinUrl());
        if (applicantDTO.user().selectedLanguage() != null) {
            applicant.setSelectedLanguage(applicantDTO.user().selectedLanguage());
        }

        applicant.setStreet(applicantDTO.street());
        applicant.setPostalCode(applicantDTO.postalCode());
        applicant.setCity(applicantDTO.city());
        applicant.setCountry(applicantDTO.country());
        applicant.setBachelorDegreeName(applicantDTO.bachelorDegreeName());
        applicant.setBachelorGradingScale(applicantDTO.bachelorGradingScale());
        applicant.setBachelorGrade(applicantDTO.bachelorGrade());
        applicant.setBachelorUniversity(applicantDTO.bachelorUniversity());
        applicant.setMasterDegreeName(applicantDTO.masterDegreeName());
        applicant.setMasterGradingScale(applicantDTO.masterGradingScale());
        applicant.setMasterGrade(applicantDTO.masterGrade());
        applicant.setMasterUniversity(applicantDTO.masterUniversity());
        applicantRepository.save(applicant);

        return applicationRepository.findDtoById(updateApplicationDTO.applicationId());
    }

    /**
     * Withdraws an application by setting its state to WITHDRAWN.
     * If the application does not exist, the method does nothing.
     *
     * @param applicationId the UUID of the application to withdraw
     */
    @Transactional
    public void withdrawApplication(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            return;
        }
        application.setState(ApplicationState.WITHDRAWN);
        applicationRepository.save(application);
    }

    /**
     * Deletes an application by its ID.
     *
     * @param applicationId the UUID of the application to delete
     */
    @Transactional
    public void deleteApplication(UUID applicationId) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new EntityNotFoundException("Application with ID " + applicationId + " not found");
        }
        applicationRepository.deleteById(applicationId);
    }

    public List<ApplicationOverviewDTO> getAllApplications(UUID applicantId, int pageSize, int pageNumber) {
        return applicationRepository.findApplicationsByApplicant(applicantId, pageNumber, pageSize);
    }

    public long getNumberOfTotalApplications(UUID applicantId) {
        return this.applicationRepository.countByApplicant_UserId(applicantId);
    }
}
