package de.tum.cit.aet.application.api;

import de.tum.cit.aet.application.api.payload.CreateApplicationPayload;
import de.tum.cit.aet.application.api.payload.UpdateApplicationPayload;
import de.tum.cit.aet.application.dto.ApplicationApplicantDTO;
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
public class ApplicationController {

    private final ApplicationService applicationService;

    @Autowired
    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<ApplicationApplicantDTO> createApplication(@RequestBody CreateApplicationPayload payload) {
        // TODO check authorization
        if (payload == null || payload.applicant() == null || payload.job() == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(applicationService.createApplication(payload));
    }

    @GetMapping("/applicant/{applicantId}")
    public ResponseEntity<Set<ApplicationApplicantDTO>> getAllApplicationsOfApplicant(@PathVariable UUID applicantId) {
        // TODO check authorization
        Set<ApplicationApplicantDTO> applications = applicationService.getAllApplicationsOfApplicant(applicantId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/application/job/{jobId}")
    public ResponseEntity<Set<ApplicationApplicantDTO>> getAllApplicationsOfJob(@PathVariable UUID jobId) {
        // TODO check authorization
        Set<ApplicationApplicantDTO> applications = applicationService.getAllApplicationsOfJob(jobId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ApplicationApplicantDTO> getApplicationById(@PathVariable UUID applicationId) {
        // TODO check authorization
        ApplicationApplicantDTO application = applicationService.getApplicationById(applicationId);
        if (application != null) {
            return ResponseEntity.ok(application);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/application")
    public ResponseEntity<ApplicationApplicantDTO> updateApplication(@RequestBody UpdateApplicationPayload application) {
        // TODO check authorization
        ApplicationApplicantDTO updatedApplication = applicationService.updateApplication(application);
        return ResponseEntity.ok(updatedApplication);
    }

    @GetMapping("/application/withdraw/{applicationId}")
    public ResponseEntity<ApplicationApplicantDTO> withdrawApplication(@PathVariable UUID applicationId) {
        // TODO check authorization
        ApplicationApplicantDTO withdrawnApplication = applicationService.withdrawApplication(applicationId);
        if (withdrawnApplication != null) {
            return ResponseEntity.ok(withdrawnApplication);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/application/{applicationId}")
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID applicationId) {
        // TODO check authorization
        applicationService.deleteApplication(applicationId);
        return ResponseEntity.noContent().build();
    }
}
