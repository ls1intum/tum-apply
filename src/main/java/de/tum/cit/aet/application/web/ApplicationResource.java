package de.tum.cit.aet.application.web;

import de.tum.cit.aet.application.domain.dto.*;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.security.annotations.ApplicantOrAdmin;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import org.apache.commons.lang3.NotImplementedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
public class ApplicationResource {

    private final ApplicationService applicationService;

    @Autowired
    public ApplicationResource(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * @param jobId The UUID of the Job
     * @return ApplicationForApplicantDTO as ResponseEntity, or 400 Bad Request if
     * the createApplicationDTO is invalid
     */
    @ApplicantOrAdmin
    @PostMapping("/create/{jobId}")
    public ResponseEntity<ApplicationForApplicantDTO> createApplication(@PathVariable UUID jobId) {
        ApplicationForApplicantDTO applicationForApplicantDTO = applicationService.createApplication(jobId);
        return ResponseEntity.ok(applicationForApplicantDTO);
    }

    /**
     * @param application the updated application
     * @return updated ApplicationForApplicantDTO
     */
    @ApplicantOrAdmin
    @PutMapping
    public ResponseEntity<ApplicationForApplicantDTO> updateApplication(@RequestBody UpdateApplicationDTO application) {
        ApplicationForApplicantDTO updatedApplication = applicationService.updateApplication(application);
        return ResponseEntity.ok(updatedApplication);
    }

    /**
     * @param applicationId the UUID of the application
     * @return the ApplicationForApplicantDTO if found, otherwise 404 Not Found
     */
    @ApplicantOrAdmin
    @GetMapping("/{applicationId}")
    public ResponseEntity<ApplicationForApplicantDTO> getApplicationById(@PathVariable UUID applicationId) {
        ApplicationForApplicantDTO application = applicationService.getApplicationById(applicationId);
        if (application!=null) {
            return ResponseEntity.ok(application);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * @param applicationId the UUID of the application
     * @return 204 No Content when deletion is successful
     */
    @ApplicantOrAdmin
    @DeleteMapping("/{applicationId}")
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID applicationId) {
        applicationService.deleteApplication(applicationId);
        return ResponseEntity.noContent().build();
    }

    /**
     * @param documentDictionaryId id of the documentDictionary that will be deleted
     * @return 204 No Content when deletion is successful
     */
    @ApplicantOrAdmin
    @DeleteMapping("/delete-document/{documentDictionaryId}")
    public ResponseEntity<Void> deleteDocumentFromApplication(@PathVariable UUID documentDictionaryId) {
        applicationService.deleteDocument(documentDictionaryId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Renames a document associated with an application.
     *
     * @param documentDictionaryId the UUID of the document to rename
     * @param newName              the new name to assign to the document
     * @return {@code 200 OK} if the rename operation was successful
     */
    @ApplicantOrAdmin
    @PutMapping("/rename-document/{documentDictionaryId}")
    public ResponseEntity<Void> renameDocument(@PathVariable UUID documentDictionaryId, @RequestParam String newName) {
        applicationService.renameDocument(documentDictionaryId, newName);
        return ResponseEntity.ok().build();
    }

    /**
     * Withdraws a specific application.
     *
     * @param applicationId
     * @return the withdrawn ApplicationForApplicantDTO, or 404 Not Found if not
     * found
     */
    @ApplicantOrAdmin
    @PutMapping("/withdraw/{applicationId}")
    public ResponseEntity<Void> withdrawApplication(@PathVariable UUID applicationId) {
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
    @ApplicantOrAdmin
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
    @ApplicantOrAdmin
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
    @ApplicantOrAdmin
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
    @ApplicantOrAdmin
    @PostMapping("/upload-documents/{applicationId}/{documentType}")
    public ResponseEntity<Set<DocumentInformationHolderDTO>> uploadDocuments(
        @PathVariable UUID applicationId,
        @PathVariable DocumentType documentType,
        @RequestParam("files") List<MultipartFile> files
    ) {
        Set<DocumentInformationHolderDTO> documentIdsOfUploadedDocuments = applicationService.getDocumentIdsOfApplicationAndType(
            applicationId,
            documentType,
            files
        );

        return ResponseEntity.ok(documentIdsOfUploadedDocuments);
    }

    /**
     * Retrieves document IDs associated with the given application.
     *
     * @param applicationId the UUID of the application
     * @return the document ID mappings for the application
     */
    @ApplicantOrAdmin
    @GetMapping("/getDocumentIds/{applicationId}")
    public ResponseEntity<ApplicationDocumentIdsDTO> getDocumentDictionaryIds(@PathVariable UUID applicationId) {
        return ResponseEntity.ok(applicationService.getDocumentDictionaryIdsOfApplication(applicationId));
    }
}
