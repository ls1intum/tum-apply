package de.tum.cit.aet.application.domain.dto;

import java.util.List;
import java.util.UUID;

/**
 * Filter DTO for the admin "All Applications" page. All fields optional.
 *
 * @param states                  optional filter for multiple application states (string values of ApplicationState)
 * @param researchGroupIds        optional filter for one or more research-group ids
 * @param supervisingProfessorIds optional filter for one or more supervising-professor user ids
 * @param jobIds                  optional filter for one or more job ids
 */
public record AdminApplicationsFilterDTO(
    List<String> states,
    List<UUID> researchGroupIds,
    List<UUID> supervisingProfessorIds,
    List<UUID> jobIds
) {}
