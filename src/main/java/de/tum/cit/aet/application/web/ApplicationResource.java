package de.tum.cit.aet.application.web;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
     * @param createApplicationDTO The data necessary to create an Application
     * @return ApplicationForApplicantDTO as Responseentity, or 400 Bad Request if the createApplicationDTO is invalid
     */
    @PostMapping
    public ResponseEntity<ApplicationForApplicantDTO> createApplication(@RequestBody CreateApplicationDTO createApplicationDTO) {
        // TODO check authorization

        ApplicationForApplicantDTO applicationForApplicantDTO = applicationService.createApplication(createApplicationDTO);
        return ResponseEntity.ok(applicationForApplicantDTO);
    }

    /**
     *
     * @param application the updated application
     * @return updated ApplicationForApplicantDTO
     */
    @PutMapping
    public ResponseEntity<ApplicationForApplicantDTO> updateApplication(@RequestBody UpdateApplicationDTO application) {
        // TODO check authorization
        ApplicationForApplicantDTO updatedApplication = applicationService.updateApplication(application);
        return ResponseEntity.ok(updatedApplication);
    }

    /**
     *
     * @param applicationId the UUID of the application
     * @return the ApplicationForApplicantDTO if found, otherwise 404 Not Found
     */
    @GetMapping("/{applicationId}")
    public ResponseEntity<ApplicationForApplicantDTO> getApplicationById(@PathVariable UUID applicationId) {
        // TODO check authorization
        ApplicationForApplicantDTO application = applicationService.getApplicationById(applicationId);
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
     * @return Set of ApplicationForApplicantDTOm where the applicant has the applicantId as UUID
     */
    @GetMapping("/applicant/{applicantId}")
    public ResponseEntity<Set<ApplicationForApplicantDTO>> getAllApplicationsOfApplicant(@PathVariable UUID applicantId) {
        // TODO check authorization
        Set<ApplicationForApplicantDTO> applications = applicationService.getAllApplicationsOfApplicant(applicantId);
        return ResponseEntity.ok(applications);
    }

    /**
     *
     * @param jobId the UUID of the Job
     * @return Set of ApplicationForApplicantDTOs where the job has the jobId as UUID
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<Set<ApplicationForApplicantDTO>> getAllApplicationsOfJob(@PathVariable UUID jobId) {
        // TODO check authorization
        Set<ApplicationForApplicantDTO> applications = applicationService.getAllApplicationsOfJob(jobId);
        return ResponseEntity.ok(applications);
    }

    /**
     * Withdraws a specific application.
     *
     * @param applicationId
     * @return the withdrawn ApplicationForApplicantDTO, or 404 Not Found if not found
     */
    @PutMapping("/withdraw/{applicationId}")
    public ResponseEntity<ApplicationForApplicantDTO> withdrawApplication(@PathVariable UUID applicationId) {
        // TODO check authorization
        ApplicationForApplicantDTO withdrawnApplication = applicationService.withdrawApplication(applicationId);
        if (withdrawnApplication != null) {
            return ResponseEntity.ok(withdrawnApplication);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{applicationId}/test-documents")
    public ResponseEntity<Void> testUploadDocuments(@PathVariable UUID applicationId, @RequestParam("files") List<MultipartFile> files) {
        User user = new User();
        user.setUserId(UUID.fromString("00000000-0000-0000-0000-000000000103"));

        Application application = new Application();
        application.setApplicationId(UUID.fromString(applicationId.toString()));

        //applicationService.uploadBachelorTranscripts(files, application, user);
        applicationService.uploadMasterTranscripts(files, application, user);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/{applicationId}/test-documents")
    public ResponseEntity<Resource> testDownloadDocuments(@PathVariable UUID applicationId) {
        Application application = new Application();
        application.setApplicationId(UUID.fromString(applicationId.toString()));

        //return ResponseEntity.ok(applicationService.downloadBachelorTranscripts(application));
        return ResponseEntity.ok(applicationService.downloadMasterTranscripts(application).getFirst());
    }
}
