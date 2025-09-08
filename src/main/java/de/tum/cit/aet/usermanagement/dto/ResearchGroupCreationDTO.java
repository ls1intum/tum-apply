package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupCreationDTO(
    String name,

    String headName,
    String universityID
    ) {

}
