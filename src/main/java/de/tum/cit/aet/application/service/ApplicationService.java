package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public ApplicationService(
        ApplicationRepository applicationRepository,
        ApplicantRepository applicantRepository,
        JobRepository jobRepository,
        UserRepository userRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

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

        Applicant applicant = new Applicant();
        applicant.setUserId(UUID.fromString("00000000-0000-0000-0000-000000000103"));
        applicant.setEmail(createApplicationDTO.applicant().user().email());
        applicant.setFirstName(createApplicationDTO.applicant().user().firstName());
        applicant.setLastName(createApplicationDTO.applicant().user().lastName());
        applicant.setGender(createApplicationDTO.applicant().user().gender());
        applicant.setNationality(createApplicationDTO.applicant().user().nationality());
        applicant.setBirthday(createApplicationDTO.applicant().user().birthday());
        applicant.setPhoneNumber(createApplicationDTO.applicant().user().phoneNumber());
        applicant.setWebsite(createApplicationDTO.applicant().user().website());
        applicant.setLinkedinUrl(createApplicationDTO.applicant().user().linkedinUrl());
        applicant.setSelectedLanguage(createApplicationDTO.applicant().user().selectedLanguage());

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
        ApplicantDTO applicantDto = updateApplicationDTO.applicant();
        applicantRepository.updateApplicant(
            applicantDto.street(),
            applicantDto.postalCode(),
            applicantDto.city(),
            applicantDto.country(),
            applicantDto.bachelorDegreeName(),
            applicantDto.bachelorGradingScale().name(),
            applicantDto.bachelorGrade(),
            applicantDto.bachelorUniversity(),
            applicantDto.masterDegreeName(),
            applicantDto.masterGradingScale().name(),
            applicantDto.masterGrade(),
            applicantDto.masterUniversity(),
            applicantDto.user().userId()
        );
        userRepository.updateUser(
            applicantDto.user().email(),
            applicantDto.user().firstName(),
            applicantDto.user().lastName(),
            applicantDto.user().gender(),
            applicantDto.user().nationality(),
            applicantDto.user().birthday(),
            applicantDto.user().phoneNumber(),
            applicantDto.user().website(),
            applicantDto.user().linkedinUrl(),
            applicantDto.user().selectedLanguage(),
            applicantDto.user().userId()
        );
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
        applicationRepository.deleteById(applicationId);
    }
}
