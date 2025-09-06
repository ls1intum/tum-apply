package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupLargeDTO(
        String description,
        String email,
        String website,
        String street,
        String postalCode,
        String city) {

}
