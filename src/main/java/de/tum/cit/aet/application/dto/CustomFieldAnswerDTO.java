package de.tum.cit.aet.application.dto;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.dto.DocumentDTO;
import de.tum.cit.aet.job.dto.CustomFieldDTO;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public record CustomFieldAnswerDTO(
    UUID customFieldAnswerId,
    CustomFieldDTO customField,
    List<String> answers,
    List<DocumentDTO> documents
) {
    public static CustomFieldAnswerDTO getFromEntity(CustomFieldAnswer answer) {
        if (answer == null) {
            return null;
        }
        return new CustomFieldAnswerDTO(answer.getCustomFieldAnswerId(), new CustomFieldDTO(), answer.getAnswers(), new ArrayList<>());
    }
}
