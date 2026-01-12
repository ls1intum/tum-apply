package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.dto.ProfessorDTO;
import java.util.List;

/**
 * DTO for the applicant interview slot booking page.
 * Contains job information, user's current booking status, and available slots.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record BookingDTO(
    String jobTitle,
    String researchGroupName,
    ProfessorDTO supervisor,
    UserBookingInfoDTO userBookingInfo,
    List<InterviewSlotDTO> availableSlots
) {}
