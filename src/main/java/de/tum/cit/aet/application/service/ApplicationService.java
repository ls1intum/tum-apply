package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;

    public ApplicationService(ApplicationRepository repository) {
        this.repository = repository;
    }

    /**
     *
     * @param createApplicationDTO
     * @return created ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO createApplication(CreateApplicationDTO createApplicationDTO) {
        Application application = new Application(
            null,
            null, // no applicationReview yet
            null, //TODO get User from UUID
            null, // TODO get Job from JobcardDTO
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
            null, // TODO get CustomAnswers from CustomAnswerDto,
            null
        );

        Application savedApplication = repository.save(application);

        return ApplicationForApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     *
     * @param applicantId
     * @return Set of ApplicationForApplicantDTO which all have the same applicant
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfApplicant(UUID applicantId) {
        return repository
            .findAllByApplicantUserId(applicantId)
            .stream()
            .map(ApplicationForApplicantDTO::getFromEntity)
            .collect(Collectors.toSet());
    }

    /**
     *
     * @param jobId
     * @return Set of ApplicationForApplicantDTO which all have the same Job
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfJob(UUID jobId) {
        return repository.findAllByJobJobId(jobId).stream().map(ApplicationForApplicantDTO::getFromEntity).collect(Collectors.toSet());
    }

    /**
     *
     * @param applicationId
     * @return ApplicationForApplicantDTO with same Id as parameter applicationId
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        Application application = repository.findById(applicationId).orElse(null);
        return ApplicationForApplicantDTO.getFromEntity(application);
    }

    /**
     *
     * @param updateApplicationDTO
     * @return updated ApplicationForApplicantDTO with updated values
     */
    @Transactional
    public ApplicationForApplicantDTO updateApplication(UpdateApplicationDTO updateApplicationDTO) {
        Application application = repository.findById(updateApplicationDTO.applicationId()).orElse(null);
        // TODO set values of application
        Application updateApplication = repository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(updateApplication);
    }

    /**
     *
     * @param applicationId
     * @return withdrawn ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO withdrawApplication(UUID applicationId) {
        Application application = repository.findById(applicationId).orElse(null);
        if (application == null) {
            return null;
        }
        application.setState(ApplicationState.WITHDRAWN);
        Application savedApplication = repository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     *
     * @param applicationId
     */
    @Transactional
    public void deleteApplication(UUID applicationId) {
        repository.deleteById(applicationId);
    }
}
