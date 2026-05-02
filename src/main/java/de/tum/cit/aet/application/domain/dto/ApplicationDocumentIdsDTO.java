package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Set;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ApplicationDocumentIdsDTO {

    private Set<DocumentInformationHolderDTO> bachelorDocumentIds;

    private Set<DocumentInformationHolderDTO> masterDocumentIds;

    private Set<DocumentInformationHolderDTO> referenceDocumentIds;

    private DocumentInformationHolderDTO cvDocumentId;
}
