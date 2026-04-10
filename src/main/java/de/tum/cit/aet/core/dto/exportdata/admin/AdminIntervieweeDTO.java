package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Flat representation of an {@link de.tum.cit.aet.interview.domain.Interviewee}
 * along with its scheduled slots.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminIntervieweeDTO(
    UUID intervieweeId,
    UUID interviewProcessId,
    Instant lastInvited,
    AssessmentRating rating,
    String assessmentNotes,
    List<AdminInterviewSlotDTO> slots
) {}
