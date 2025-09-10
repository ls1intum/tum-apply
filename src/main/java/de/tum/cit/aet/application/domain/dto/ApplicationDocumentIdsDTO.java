package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ApplicationDocumentIdsDTO {

    private Set<DocumentInformationHolderDTO> bachelorDocumentDictionaryIds;

    private Set<DocumentInformationHolderDTO> masterDocumentDictionaryIds;

    private Set<DocumentInformationHolderDTO> referenceDocumentDictionaryIds;

    private DocumentInformationHolderDTO cvDocumentDictionaryId;
}
