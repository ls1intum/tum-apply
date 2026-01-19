package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record SendInvitationsRequestDTO(Boolean onlyUninvited, List<UUID> intervieweeIds) {}
