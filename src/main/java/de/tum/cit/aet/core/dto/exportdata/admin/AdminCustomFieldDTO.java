package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.CustomFieldType;
import java.util.List;
import java.util.UUID;

/** Flat representation of a {@link de.tum.cit.aet.job.domain.CustomField}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminCustomFieldDTO(
    UUID customFieldId,
    String question,
    boolean required,
    CustomFieldType customFieldType,
    List<String> answerOptions,
    int sequence
) {}
