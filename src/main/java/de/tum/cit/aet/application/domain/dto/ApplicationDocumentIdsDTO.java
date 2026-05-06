package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Set;
import lombok.Data;

/**
 * Aggregated document references for an application (or applicant profile), grouped by category.
 * Returned by the application/applicant document-id endpoints so the client can render each
 * document section without making a separate request per type.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ApplicationDocumentIdsDTO {

    /** Bachelor transcript documents. */
    private Set<DocumentInformationHolderDTO> bachelorDocumentIds;

    /** Master transcript documents. */
    private Set<DocumentInformationHolderDTO> masterDocumentIds;

    /** Reference letter documents. */
    private Set<DocumentInformationHolderDTO> referenceDocumentIds;

    /** The single CV document (or {@code null} if none has been uploaded). */
    private DocumentInformationHolderDTO cvDocumentId;
}
