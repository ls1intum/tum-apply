package de.tum.cit.aet.application.web;

import de.tum.cit.aet.application.domain.dto.ApplicationApplicantDTO;
import de.tum.cit.aet.application.domain.payload.CreateApplicationPayload;
import de.tum.cit.aet.application.domain.payload.UpdateApplicationPayload;
import de.tum.cit.aet.application.service.ApplicationService;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationResource {

    private final ApplicationService applicationService;

    @Autowired
    public ApplicationResource(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     *
     * @param payload The payload necessary to create an Application
     * @return ApplicationApplicantDto as Responseentity, or 400 Bad Request if the payload is invalid
     */
    @PostMapping
    public ResponseEntity<ApplicationApplicantDTO> createApplication(@RequestBody CreateApplicationPayload payload) {
        // TODO check authorization
        if (payload == null || payload.applicant() == null || payload.job() == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(applicationService.createApplication(payload));
    }

    /**
     *
     * @param application the updated application payload
     * @return updated ApplicationApplicantDTO
     */
    @PutMapping
    public ResponseEntity<ApplicationApplicantDTO> updateApplication(@RequestBody UpdateApplicationPayload application) {
        // TODO check authorization
        ApplicationApplicantDTO updatedApplication = applicationService.updateApplication(application);
        return ResponseEntity.ok(updatedApplication);
    }

    /**
     *
     * @param applicationId the UUID of the application
     * @return the ApplicationApplicantDTO if found, otherwise 404 Not Found
     */
    @GetMapping("/{applicationId}")
    public ResponseEntity<ApplicationApplicantDTO> getApplicationById(@PathVariable UUID applicationId) {
        // TODO check authorization
        ApplicationApplicantDTO application = applicationService.getApplicationById(applicationId);
        if (application != null) {
            return ResponseEntity.ok(application);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     *
     * @param applicationId the UUID of the application
     * @return 204 No Content when deletion is successful
     */
    @DeleteMapping("/{applicationId}")
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID applicationId) {
        // TODO check authorization
        applicationService.deleteApplication(applicationId);
        return ResponseEntity.noContent().build();
    }

    /**
     *
     * @param applicantId the UUID of the applicant
     * @return Set of ApplicationApplicantDtom where the applicant has the applicantId as UUID
     */
    @GetMapping("/applicant/{applicantId}")
    public ResponseEntity<Set<ApplicationApplicantDTO>> getAllApplicationsOfApplicant(@PathVariable UUID applicantId) {
        // TODO check authorization
        Set<ApplicationApplicantDTO> applications = applicationService.getAllApplicationsOfApplicant(applicantId);
        return ResponseEntity.ok(applications);
    }

    /**
     *
     * @param jobId the UUID of the Job
     * @return Set of ApplicationApplicantDtos where the job has the jobId as UUID
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<Set<ApplicationApplicantDTO>> getAllApplicationsOfJob(@PathVariable UUID jobId) {
        // TODO check authorization
        Set<ApplicationApplicantDTO> applications = applicationService.getAllApplicationsOfJob(jobId);
        return ResponseEntity.ok(applications);
    }

    /**
     * Withdraws a specific application.
     *
     * @param applicationId
     * @return the withdrawn ApplicationApplicantDTO, or 404 Not Found if not found
     */
    @PutMapping("/withdraw/{applicationId}")
    public ResponseEntity<ApplicationApplicantDTO> withdrawApplication(@PathVariable UUID applicationId) {
        // TODO check authorization
        ApplicationApplicantDTO withdrawnApplication = applicationService.withdrawApplication(applicationId);
        if (withdrawnApplication != null) {
            return ResponseEntity.ok(withdrawnApplication);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
