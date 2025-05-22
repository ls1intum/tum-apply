package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;

    public ApplicationService(ApplicationRepository applicationRepository, ApplicantRepository applicantRepository) {
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
    }

    /**
     *
     * @param createApplicationDTO
     * @return created ApplicationForApplicantDTO
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

        ApplicantDTO applicantDto = createApplicationDTO.applicant();
        applicantRepository.updateApplicant(
            UUID.fromString("00000000-0000-0000-0000-000000000103"),
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
            applicantDto.street(),
            applicantDto.postalCode(),
            applicantDto.city(),
            applicantDto.country(),
            applicantDto.bachelorDegreeName(),
            applicantDto.bachelorGradingScale(),
            applicantDto.bachelorGrade(),
            applicantDto.bachelorUniversity(),
            applicantDto.masterDegreeName(),
            applicantDto.masterGradingScale(),
            applicantDto.masterGrade(),
            applicantDto.masterUniversity()
        );

        applicationRepository.insertApplication(
            createApplicationDTO.applicant().user().userId(),
            createApplicationDTO.jobId(),
            createApplicationDTO.applicationState().name(),
            createApplicationDTO.desiredDate(),
            createApplicationDTO.projects(),
            createApplicationDTO.specialSkills(),
            createApplicationDTO.motivation()
        );
        return applicationRepository.getApplicationDtoByApplicantUserIdAndJobJobId(
            createApplicationDTO.applicant().user().userId(),
            createApplicationDTO.jobId()
        );
    }

    /**
     *
     * @param applicantId
     * @return Set of ApplicationForApplicantDTO which all have the same applicant
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfApplicant(UUID applicantId) {
        return applicationRepository.findAllDtosByApplicantUserId(applicantId);
    }

    /**
     *
     * @param jobId
     * @return Set of ApplicationForApplicantDTO which all have the same Job
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfJob(UUID jobId) {
        return applicationRepository.findAllDtosByJobJobId(jobId);
    }

    /**
     *
     * @param applicationId
     * @return ApplicationForApplicantDTO with same Id as parameter applicationId
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        return applicationRepository.findDtoById(applicationId);
    }

    /**
     *
     * @param updateApplicationDTO
     * @return updated ApplicationForApplicantDTO with updated values
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
        return applicationRepository.findDtoById(updateApplicationDTO.applicationId());
    }

    /**
     *
     * @param applicationId
     * @return withdrawn ApplicationForApplicantDTO
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
     *
     * @param applicationId
     */
    @Transactional
    public void deleteApplication(UUID applicationId) {
        applicationRepository.deleteById(applicationId);
    }
}
