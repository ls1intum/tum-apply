package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.UUID;

/** Flat representation of an {@link de.tum.cit.aet.application.domain.CustomFieldAnswer}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminCustomFieldAnswerDTO(UUID customFieldAnswerId, UUID customFieldId, List<String> answers) {}
