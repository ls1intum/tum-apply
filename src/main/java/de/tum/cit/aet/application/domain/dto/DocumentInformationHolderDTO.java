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

    /**
     * Creates a {@link DocumentInformationHolderDTO} from a given
     * {@link DocumentDictionary}.
     *
     * @param dictionary the document dictionary entity to convert
     * @return a DTO containing document information
     */
    public static DocumentInformationHolderDTO getFromDocumentDictionary(DocumentDictionary dictionary) {
        return new DocumentInformationHolderDTO(
            dictionary.getDocumentDictionaryId(),
            dictionary.getDocument().getSizeBytes(),
            dictionary.getName()
        );
    }
}
