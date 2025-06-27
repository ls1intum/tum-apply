package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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

    public static DocumentInformationHolderDTO getFromDocumentDictionary(DocumentDictionary dictionary) {
        return new DocumentInformationHolderDTO(
            dictionary.getDocumentDictionaryId(),
            dictionary.getDocument().getSizeBytes(),
            dictionary.getName()
        );
    }
}
