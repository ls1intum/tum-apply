package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.documents.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class DocumentInformationHolderDTO {

    @NotNull
    private UUID id;

    @NotNull
    private long size;

    private String name;

    private DocumentType documentType;

    /**
     * Creates a {@link DocumentInformationHolderDTO} from the new unified Document model.
     */
    public static DocumentInformationHolderDTO fromDocument(Document document) {
        return new DocumentInformationHolderDTO(
            document.getDocumentId(),
            document.getSizeBytes(),
            document.getName(),
            document.getDocumentType()
        );
    }

    /**
     * Legacy factory for the {@link DocumentDictionary} model. Removed in the final migration session
     * once all callers move to {@link #fromDocument(Document)}.
     */
    public static DocumentInformationHolderDTO getFromDocumentDictionary(DocumentDictionary dictionary) {
        return new DocumentInformationHolderDTO(
            dictionary.getDocumentDictionaryId(),
            dictionary.getDocument().getSizeBytes(),
            dictionary.getName(),
            dictionary.getDocumentType()
        );
    }
}
