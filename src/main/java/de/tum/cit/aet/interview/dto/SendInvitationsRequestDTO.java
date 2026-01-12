package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record SendInvitationsRequestDTO(Boolean onlyUninvited) {}
