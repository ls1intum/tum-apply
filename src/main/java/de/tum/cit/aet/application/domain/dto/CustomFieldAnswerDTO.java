package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.dto.DocumentDTO;
import de.tum.cit.aet.job.dto.CustomFieldDTO;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CustomFieldAnswerDTO(
    UUID customFieldAnswerId,
    CustomFieldDTO customField,
    List<String> answers,
    List<DocumentDTO> documents
) {
    /**
     * @param answer the entity to convert; may be {@code null}
     * @return a DTO embedding the related custom field, or {@code null} if {@code answer} is {@code null}
     */
    public static CustomFieldAnswerDTO getFromEntity(CustomFieldAnswer answer) {
        if (answer == null) {
            return null;
        }
        return new CustomFieldAnswerDTO(
            answer.getCustomFieldAnswerId(),
            CustomFieldDTO.getFromEntity(answer.getCustomField()),
            answer.getAnswers(),
            new ArrayList<>()
        );
    }
}
