package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.documents.domain.Document;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Compact document descriptor returned to the client. Carries the metadata needed to
 * render a document entry (id, size, name, type) without exposing the entity or its file path.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class DocumentInformationHolderDTO {

    /** The document id (used by the client to download or delete the document). */
    @NotNull
    private UUID id;

    /** Size of the file in bytes. */
    @NotNull
    private long size;

    /** Display name shown to the user. */
    private String name;

    /** The document type (CV, transcript, reference, ...). */
    private DocumentType documentType;

    /**
     * Builds a DTO from a {@link Document} entity.
     *
     * @param document the document entity to project
     * @return the corresponding DTO
     */
    public static DocumentInformationHolderDTO fromDocument(Document document) {
        return new DocumentInformationHolderDTO(
            document.getDocumentId(),
            document.getSizeBytes(),
            document.getName(),
            document.getDocumentType()
        );
    }
}
