package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationApplicantDTO;
import de.tum.cit.aet.application.domain.payload.CreateApplicationPayload;
import de.tum.cit.aet.application.domain.payload.UpdateApplicationPayload;
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
     * @param payload
     * @return created ApplicationApplicantDTO
     */
    @Transactional
    public ApplicationApplicantDTO createApplication(CreateApplicationPayload payload) {
        Application application = new Application(
            null,
            null, // no applicationReview yet
            null, //TODO get User from UUID
            null, // TODO get Job from JobcardDTO
            payload.applicationState(),
            payload.desiredDate(),
            null,
            null,
            null,
            null,
            payload.projects(),
            payload.specialSkills(),
            payload.motivation(),
            null,
            null, // TODO get CustomAnswers from CustomAnswerDto,
            null
        );

        Application savedApplication = repository.save(application);

        return ApplicationApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     *
     * @param applicantId
     * @return Set of ApplicationApplicantDTO which all have the same applicant
     */
    @Transactional(readOnly = true)
    public Set<ApplicationApplicantDTO> getAllApplicationsOfApplicant(UUID applicantId) {
        return repository
            .findAllByApplicantUserId(applicantId)
            .stream()
            .map(ApplicationApplicantDTO::getFromEntity)
            .collect(Collectors.toSet());
    }

    /**
     *
     * @param jobId
     * @return Set of ApplicationApplicantDTO which all have the same Job
     */
    @Transactional(readOnly = true)
    public Set<ApplicationApplicantDTO> getAllApplicationsOfJob(UUID jobId) {
        return repository.findAllByJobJobId(jobId).stream().map(ApplicationApplicantDTO::getFromEntity).collect(Collectors.toSet());
    }

    /**
     *
     * @param applicationId
     * @return ApplicationApplicantDTO with same Id as parameter applicationId
     */
    @Transactional(readOnly = true)
    public ApplicationApplicantDTO getApplicationById(UUID applicationId) {
        Application application = repository.findById(applicationId).orElse(null);
        return ApplicationApplicantDTO.getFromEntity(application);
    }

    /**
     *
     * @param updateApplicationPayload
     * @return updated ApplicationApplicantDTO with updated values
     */
    @Transactional
    public ApplicationApplicantDTO updateApplication(UpdateApplicationPayload updateApplicationPayload) {
        Application application = repository.findById(updateApplicationPayload.applicationId()).orElse(null);
        // TODO set values of application
        Application updateApplication = repository.save(application);
        return ApplicationApplicantDTO.getFromEntity(updateApplication);
    }

    /**
     *
     * @param applicationId
     * @return withdrawn ApplicationApplicantDTO
     */
    @Transactional
    public ApplicationApplicantDTO withdrawApplication(UUID applicationId) {
        Application application = repository.findById(applicationId).orElse(null);
        if (application == null) {
            return null;
        }
        application.setState(ApplicationState.WITHDRAWN);
        Application savedApplication = repository.save(application);
        return ApplicationApplicantDTO.getFromEntity(savedApplication);
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
