package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.CustomFieldType;
import de.tum.cit.aet.job.domain.CustomField;
import java.util.List;
import java.util.UUID;

/**
 * Flat representation of a {@link CustomField} attached to a job posting.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CustomFieldDTO(
    UUID customFieldId,
    String question,
    boolean required,
    CustomFieldType customFieldType,
    List<String> answerOptions,
    int sequence
) {
    /**
     * @param customField the entity to convert; may be {@code null}
     * @return a flat DTO, or {@code null} if {@code customField} is {@code null}
     */
    public static CustomFieldDTO getFromEntity(CustomField customField) {
        if (customField == null) {
            return null;
        }
        return new CustomFieldDTO(
            customField.getCustomFieldId(),
            customField.getQuestion(),
            customField.isRequired(),
            customField.getCustomFieldType(),
            customField.getAnswerOptions(),
            customField.getSequence()
        );
    }
}
