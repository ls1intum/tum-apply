package de.tum.cit.aet.application.web;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import de.tum.cit.aet.application.domain.dto.DocumentInformationHolderDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.constants.DocumentType;
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
     * @param jobId The UUID of the Job
     * @param applicantId Temporarily the id of the applicant (to be removed with serverside user handling)
     * @return ApplicationForApplicantDTO as Responseentity, or 400 Bad Request if
     *         the createApplicationDTO is invalid
     */
    @PostMapping("/create/{jobId}/applicant/{applicantId}")
    public ResponseEntity<ApplicationForApplicantDTO> createApplication(@PathVariable UUID jobId, @PathVariable UUID applicantId) {
        // TODO check authorization

        ApplicationForApplicantDTO applicationForApplicantDTO = applicationService.createApplication(jobId, applicantId);
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
     *
     * @param documentDictionaryId id of the documentDictionary that will be deleted
     * @return 204 No Content when deletion is successful
     */
    @PreAuthorize("hasRole('APPLICANT')")
    @DeleteMapping("/delete-document/{documentDictionaryId}")
    public ResponseEntity<Void> deleteDocumentFromApplication(@PathVariable UUID documentDictionaryId) {
        // simulate current user (replace with actual auth in production)
        applicationService.deleteDocument(documentDictionaryId);
        return ResponseEntity.noContent().build();
    }

    /**
     *
     * @param applicationId id of the application
     * @param documentType  document type, of which the documents will be deleted
     * @return 204 no content when deletion is successful
     */
    @PreAuthorize("hasRole('APPLICANT')")
    @DeleteMapping("/batch-delete-document/{applicationId}/{documentType}")
    public ResponseEntity<Void> deleteDocumentBatchByTypeFromApplication(
        @PathVariable UUID applicationId,
        @PathVariable DocumentType documentType
    ) {
        applicationService.deleteDocumentTypeOfDocuments(applicationId, documentType);
        return ResponseEntity.noContent().build();
    }

    /**
     * Renames a document associated with an application.
     *
     * @param documentDictionaryId the UUID of the document to rename
     * @param newName              the new name to assign to the document
     * @return {@code 200 OK} if the rename operation was successful
     *
     */
    @PutMapping("/rename-document/{documentDictionaryId}")
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<Void> renameDocument(@PathVariable UUID documentDictionaryId, @RequestParam String newName) {
        applicationService.renameDocument(documentDictionaryId, newName);
        return ResponseEntity.ok().build();
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

    /**
     * Retrieves a paginated list of application overviews for the current user.
     *
     * @param pageSize   The number of items per page (default: 25).
     * @param pageNumber The page number to retrieve (default: 0).
     * @return A list of {@link ApplicationOverviewDTO} representing the application overview data.
     */
    @GetMapping("/pages")
    public ResponseEntity<List<ApplicationOverviewDTO>> getApplicationPages(
        @RequestParam(required = false, defaultValue = "25") @Min(1) int pageSize,
        @RequestParam(required = false, defaultValue = "0") @Min(0) int pageNumber
    ) {
        // purposes
        return ResponseEntity.ok(applicationService.getAllApplications(pageSize, pageNumber));
    }

    /**
     * Retrieves the total number of applications submitted by a specific applicant.
     * Can be removed once sorting and filtering demands using a ApplicationPageDTO, where this data can be directly included
     *
     * @param applicantId The UUID of the applicant.
     * @return The total count of applications.
     */
    @GetMapping("/pages/length/{applicantId}")
    public ResponseEntity<Long> getApplicationPagesLength(@PathVariable UUID applicantId) {
        // purposes
        return ResponseEntity.ok(applicationService.getNumberOfTotalApplications(applicantId));
    }

    /**
     * Retrieves the detail intormation for applicants for their application
     *
     * @param applicationId
     * @return ApplicationDetailDTO of given ID
     */
    @PreAuthorize("hasRole('APPLICANT')")
    @GetMapping("/{applicationId}/detail")
    public ResponseEntity<ApplicationDetailDTO> getApplicationForDetailPage(@PathVariable UUID applicationId) {
        ApplicationDetailDTO applicationDetailDTO = applicationService.getApplicationDetail(applicationId);
        return ResponseEntity.ok(applicationDetailDTO);
    }

    /**
     * Uploads documents for a specific application by an authenticated applicant.
     * <p>
     * Accepts multipart file uploads and routes them based on {@code documentType}.
     * Only users with {@code ROLE_APPLICANT} are allowed.
     * </p>
     *
     * <p>
     * Unsupported types throw {@link NotImplementedException}.
     * </p>
     *
     * @param applicationId UUID of the target application
     * @param documentType  type of document to upload
     * @param files         uploaded multipart files
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
    public ResponseEntity<Set<DocumentInformationHolderDTO>> uploadDocuments(
        @PathVariable UUID applicationId,
        @PathVariable DocumentType documentType,
        @RequestParam("files") List<MultipartFile> files
    ) {
        Application application = new Application();
        application.setApplicationId(UUID.fromString(applicationId.toString()));

        switch (documentType) {
            case BACHELOR_TRANSCRIPT:
            case MASTER_TRANSCRIPT:
            case REFERENCE:
                applicationService.uploadAdditionalTranscripts(files, documentType, application);
                break;
            case CV:
                applicationService.uploadCV(files.getFirst(), application);
                break; // TODO only one file allowed
            default:
                throw new NotImplementedException(String.format("The type %s is not supported yet", documentType.name()));
        }

        Set<DocumentInformationHolderDTO> documentIdsOfUploadedDocuments = applicationService.getDocumentIdsOfApplicationAndType(
            application,
            documentType
        );

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
