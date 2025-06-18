package de.tum.cit.aet.application.web;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.usermanagement.domain.User;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.apache.commons.lang3.NotImplementedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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
     * @param createApplicationDTO The data necessary to create an Application
     * @return ApplicationForApplicantDTO as Responseentity, or 400 Bad Request if
     *         the createApplicationDTO is invalid
     */
    @PostMapping
    public ResponseEntity<ApplicationForApplicantDTO> createApplication(@RequestBody CreateApplicationDTO createApplicationDTO) {
        // TODO check authorization

        ApplicationForApplicantDTO applicationForApplicantDTO = applicationService.createApplication(createApplicationDTO);
        return ResponseEntity.ok(applicationForApplicantDTO);
    }

    /**
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
     * @param applicantId the UUID of the applicant
     * @return Set of ApplicationForApplicantDTOm where the applicant has the
     *         applicantId as UUID
     */
    @GetMapping("/applicant/{applicantId}")
    public ResponseEntity<Set<ApplicationForApplicantDTO>> getAllApplicationsOfApplicant(@PathVariable UUID applicantId) {
        // TODO check authorization
        Set<ApplicationForApplicantDTO> applications = applicationService.getAllApplicationsOfApplicant(applicantId);
        return ResponseEntity.ok(applications);
    }

    /**
     * @param jobId the UUID of the Job
     * @return Set of ApplicationForApplicantDTOs where the job has the jobId as
     *         UUID
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
     * @return the withdrawn ApplicationForApplicantDTO, or 404 Not Found if not
     *         found
     */
    @PutMapping("/withdraw/{applicationId}")
    public ResponseEntity<Void> withdrawApplication(@PathVariable UUID applicationId) {
        // TODO check authorization
        applicationService.withdrawApplication(applicationId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pages")
    public ResponseEntity<List<ApplicationOverviewDTO>> getApplicationPages(
        @RequestParam(required = false, defaultValue = "25") @Min(1) int pageSize,
        @RequestParam(required = false, defaultValue = "0") @Min(0) int pageNumber
    ) {
        final UUID applicantId = UUID.fromString("00000000-0000-0000-0000-000000000104"); // temporary for testing
        // purposes
        return ResponseEntity.ok(applicationService.getAllApplications(applicantId, pageSize, pageNumber));
    }

    @GetMapping("/pages/length")
    public ResponseEntity<Long> getApplicationPagesLength() {
        final UUID applicantId = UUID.fromString("00000000-0000-0000-0000-000000000104"); // temporary for testing
        // purposes
        return ResponseEntity.ok(applicationService.getNumberOfTotalApplications(applicantId));
    }

    // TODO this is only for testing and can be removed
    /**
     * Test endpoint for uploading multiple documents related to an application.
     * <p>
     * <b>Note:</b> This endpoint is for testing purposes only and will be removed.
     * File uploads should be integrated into {@code createApplication()} and
     * {@code updateApplication()}.
     * </p>
     *
     * @param applicationId the ID of the application to associate the uploaded
     *                      documents with
     * @param files         the list of documents to be uploaded as
     *                      {@link MultipartFile}s
     * @return {@link ResponseEntity} with HTTP 200 OK if the upload succeeds
     */
    @Hidden
    @PostMapping("/{applicationId}/test-documents")
    public ResponseEntity<Void> testUploadDocuments(@PathVariable UUID applicationId, @RequestParam("files") List<MultipartFile> files) {
        // simulate current user
        User user = new User();
        user.setUserId(UUID.fromString("00000000-0000-0000-0000-000000000103"));

        Application application = new Application();
        application.setApplicationId(UUID.fromString(applicationId.toString()));

        // applicationService.uploadBachelorTranscripts(files, application, user);
        applicationService.uploadMasterTranscripts(files, application, user);

        return ResponseEntity.ok().build();
    }

    /**
     * Uploads documents for a specific application by an authenticated applicant.
     * <p>
     * Accepts multipart file uploads and routes them based on {@code documentType}.
     * Only users with {@code ROLE_APPLICANT} are allowed.
     * </p>
     *
     * <p>Unsupported types throw {@link NotImplementedException}.</p>
     *
     * @param applicationId UUID of the target application
     * @param documentType type of document to upload
     * @param files uploaded multipart files
     * @return 200 OK if successful
     * @throws NotImplementedException if the document type is still unsupported
     */
    @Operation(
        summary = "Upload documents",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(
                mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                schema = @Schema(implementation = MultipartUploadRequest.class)
            )
        )
    )
    @PreAuthorize("hasRole('APPLICANT')")
    @PostMapping("/upload-documents/{applicationId}/{documentType}")
    public ResponseEntity<Set<UUID>> uploadDocuments(
        @PathVariable UUID applicationId,
        @PathVariable DocumentType documentType,
        @RequestParam("files") List<MultipartFile> files
    ) {
        // Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // simulate current user
        User user = new User();
        user.setUserId(UUID.fromString("00000000-0000-0000-0000-000000000103"));

        Application application = new Application();
        application.setApplicationId(UUID.fromString(applicationId.toString()));

        switch (documentType) {
            case BACHELOR_TRANSCRIPT:
                applicationService.uploadBachelorTranscripts(files, application, user);
                break;
            case MASTER_TRANSCRIPT:
                applicationService.uploadMasterTranscripts(files, application, user);
                break;
            case REFERENCE:
                applicationService.uploadReferences(files, application, user);
                break;
            case CV:
                applicationService.uploadCV(files.getFirst(), application, user);
                break; // TODO only one file allowed
            default:
                throw new NotImplementedException(String.format("The type %s is not yet implemented", documentType.name()));
        }

        Set<UUID> documentIdsOfUploadedDocuments = applicationService.getDocumentIdsOfApplicationAndType(application, documentType);

        return ResponseEntity.ok(documentIdsOfUploadedDocuments);
    }

    /**
     * Retrieves document IDs associated with the given application.
     *
     * @param applicationId the UUID of the application
     * @return the document ID mappings for the application
     */
    @GetMapping("/getDocumentIds/{applicationId}")
    public ResponseEntity<ApplicationDocumentIdsDTO> getDocumentDictionaryIds(@PathVariable UUID applicationId) {
        // TODO Authentication
        return ResponseEntity.ok(applicationService.getDocumentDictionaryIdsOfApplication(applicationId));
    }
}
