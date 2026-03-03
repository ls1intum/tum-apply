package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO representing the user's current booking status for an interview.
 * Used in the booking page response to indicate if the user has already booked
 * a slot.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record UserBookingInfoDTO(boolean hasBookedSlot, InterviewSlotDTO bookedSlot) {}
