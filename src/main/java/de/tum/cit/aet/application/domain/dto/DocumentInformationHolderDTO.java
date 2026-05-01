package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.documents.domain.Document;
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

    public static DocumentInformationHolderDTO fromDocument(Document document) {
        return new DocumentInformationHolderDTO(
            document.getDocumentId(),
            document.getSizeBytes(),
            document.getName(),
            document.getDocumentType()
        );
    }
}
