package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import java.util.List;
import java.util.UUID;

/**
 * Flat representation of a {@link CustomFieldAnswer} that keeps both the
 * answer id and the referenced custom-field id, suitable for re-importable
 * JSON dumps. The richer {@link CustomFieldAnswerDTO} (which embeds the full
 * custom-field and document DTOs) is used for the applicant view.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CustomFieldAnswerDetailDTO(UUID customFieldAnswerId, UUID customFieldId, List<String> answers) {
    /**
     * @param answer the entity to convert; may be {@code null}
     * @return a flat DTO, or {@code null} if {@code answer} is {@code null}
     */
    public static CustomFieldAnswerDetailDTO getFromEntity(CustomFieldAnswer answer) {
        if (answer == null) {
            return null;
        }
        return new CustomFieldAnswerDetailDTO(
            answer.getCustomFieldAnswerId(),
            answer.getCustomField() == null ? null : answer.getCustomField().getCustomFieldId(),
            answer.getAnswers()
        );
    }
}
