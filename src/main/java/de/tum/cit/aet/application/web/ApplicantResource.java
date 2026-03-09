package de.tum.cit.aet.application.web;

import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.application.domain.dto.DocumentInformationHolderDTO;
import de.tum.cit.aet.application.service.ApplicantService;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.security.annotations.ApplicantOrAdmin;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

@Slf4j
@RestController
@RequestMapping("/api/applicants")
public class ApplicantResource {

    private final ApplicantService applicantService;

    @Autowired
    public ApplicantResource(ApplicantService applicantService) {
        this.applicantService = applicantService;
    }

    /**
     * Retrieves the current user's applicant profile with personal information.
     *
     * @return ApplicantDTO with current user and applicant data
     */
    @ApplicantOrAdmin
    @GetMapping("/profile")
    public ResponseEntity<ApplicantDTO> getApplicantProfile() {
        log.info("GET /api/applicants/profile - Retrieving applicant profile for current user");
        return ResponseEntity.ok(applicantService.getApplicantProfile());
    }

    /**
     * Retrieves the current user's applicant profile documents grouped by type.
     *
     * @return document IDs for the applicant profile
     */
    @ApplicantOrAdmin
    @GetMapping("/profile/document-ids")
    public ResponseEntity<ApplicationDocumentIdsDTO> getApplicantProfileDocumentIds() {
        log.info("GET /api/applicants/profile/document-ids - Retrieving applicant profile document ids for current user");
        return ResponseEntity.ok(applicantService.getApplicantProfileDocumentIds());
    }

    /**
     * Updates the current user's applicant profile with personal information.
     *
     * @param applicantDTO the updated applicant data
     * @return ApplicantDTO with updated user and applicant data
     */
    @ApplicantOrAdmin
    @PutMapping("/profile")
    public ResponseEntity<ApplicantDTO> updateApplicantProfile(@Valid @RequestBody ApplicantDTO applicantDTO) {
        log.info("PUT /api/applicants/profile - Updating applicant profile for current user");
        return ResponseEntity.ok(applicantService.updateApplicantProfile(applicantDTO));
    }

    /**
     * Updates only the current user's personal information settings.
     *
     * @param applicantDTO the updated applicant personal information
     * @return ApplicantDTO with updated user and applicant data
     */
    @ApplicantOrAdmin
    @PutMapping("/profile/personal-information")
    public ResponseEntity<ApplicantDTO> updateApplicantPersonalInformation(@Valid @RequestBody ApplicantDTO applicantDTO) {
        log.info("PUT /api/applicants/profile/personal-information - Updating personal information for current user");
        return ResponseEntity.ok(applicantService.updateApplicantPersonalInformation(applicantDTO));
    }

    /**
     * Updates only the current user's document settings metadata.
     *
     * @param applicantDTO the updated applicant degree/document settings
     * @return ApplicantDTO with updated applicant data
     */
    @ApplicantOrAdmin
    @PutMapping("/profile/document-settings")
    public ResponseEntity<ApplicantDTO> updateApplicantDocumentSettings(@Valid @RequestBody ApplicantDTO applicantDTO) {
        log.info("PUT /api/applicants/profile/document-settings - Updating document settings for current user");
        return ResponseEntity.ok(applicantService.updateApplicantDocumentSettings(applicantDTO));
    }

    /**
     * Uploads documents for the current applicant profile.
     *
     * @param documentType type of document to upload
     * @param files        uploaded files
     * @return updated document list for that type
     */
    @Operation(
        summary = "Upload applicant profile documents",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(
                mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                schema = @Schema(implementation = MultipartUploadRequest.class)
            )
        )
    )
    @ApplicantOrAdmin
    @PostMapping(value = "/profile/documents/{documentType}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Set<DocumentInformationHolderDTO>> uploadApplicantProfileDocuments(
        @PathVariable DocumentType documentType,
        @RequestParam("files") List<MultipartFile> files
    ) {
        log.info("POST /api/applicants/profile/documents/{} - Uploading applicant profile documents for current user", documentType);
        return ResponseEntity.ok(applicantService.uploadApplicantProfileDocuments(documentType, files));
    }

    /**
     * Deletes a document from the current applicant profile.
     *
     * @param documentDictionaryId id of the document dictionary entry to delete
     * @return 204 No Content when deletion is successful
     */
    @ApplicantOrAdmin
    @DeleteMapping("/profile/documents/{documentDictionaryId}")
    public ResponseEntity<Void> deleteApplicantProfileDocument(@PathVariable UUID documentDictionaryId) {
        log.info("DELETE /api/applicants/profile/documents/{} - Deleting applicant profile document", documentDictionaryId);
        applicantService.deleteApplicantProfileDocument(documentDictionaryId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Renames a document associated with the current applicant profile.
     *
     * @param documentDictionaryId the UUID of the document to rename
     * @param newName              the new name to assign to the document
     * @return {@code 200 OK} if the rename operation was successful
     */
    @ApplicantOrAdmin
    @PutMapping("/profile/documents/{documentDictionaryId}/name")
    public ResponseEntity<Void> renameApplicantProfileDocument(@PathVariable UUID documentDictionaryId, @RequestParam String newName) {
        log.info("PUT /api/applicants/profile/documents/{}/name - Renaming applicant profile document", documentDictionaryId);
        applicantService.renameApplicantProfileDocument(documentDictionaryId, newName);
        return ResponseEntity.ok().build();
    }
}
