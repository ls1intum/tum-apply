package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.dto.BookingDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.dto.IntervieweeState;
import de.tum.cit.aet.interview.dto.UserBookingInfoDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.dto.ProfessorDTO;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for applicant-facing interview booking operations.
 * Handles booking page data retrieval and slot booking.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewBookingService {

    private final InterviewService interviewService;
    private final InterviewProcessRepository interviewProcessRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final CurrentUserService currentUserService;

    /**
     * Retrieves booking page data for the current user.
     * Contains job info, user's booking status, and available slots.
     *
     * @param processId the ID of the interview process
     * @return the booking data DTO
     * @throws EntityNotFoundException if the process doesn't exist
     * @throws AccessDeniedException   if user is not invited to this process
     */
    public BookingDTO getBookingData(UUID processId) {
        UUID userId = currentUserService.getUserId();
        log.info("Getting booking data for process {} and user {}", processId, userId);

        // 1. Load interview process with job
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> EntityNotFoundException.forId("InterviewProcess", processId));

        // 2. Find interviewee for current user
        Interviewee interviewee = intervieweeRepository
            .findByProcessIdAndUserId(processId, userId)
            .orElseThrow(() -> new AccessDeniedException("You are not invited to this interview process"));

        // 3. Check state - must be at least INVITED (not UNCONTACTED)
        IntervieweeState state = interviewService.calculateIntervieweeState(interviewee);
        if (state == IntervieweeState.UNCONTACTED) {
            throw new AccessDeniedException("You have not yet been invited to book an interview");
        }

        // 4. Build response
        Job job = process.getJob();
        ProfessorDTO supervisor = ProfessorDTO.fromEntity(job.getSupervisingProfessor());

        // 5. Check if already booked
        InterviewSlot bookedSlot = interviewee.getScheduledSlot();
        UserBookingInfoDTO bookingInfo = new UserBookingInfoDTO(
            bookedSlot != null,
            bookedSlot != null ? InterviewSlotDTO.fromEntity(bookedSlot) : null
        );

        // 6. Get available slots (only if not already booked)
        List<InterviewSlotDTO> availableSlots = Collections.emptyList();
        if (bookedSlot == null) {
            availableSlots = interviewSlotRepository
                .findAvailableSlotsByProcessId(processId, Instant.now())
                .stream()
                .map(InterviewSlotDTO::fromEntity)
                .toList();
        }

        return new BookingDTO(
            job.getTitle(),
            job.getResearchGroup() != null ? job.getResearchGroup().getName() : null,
            supervisor,
            bookingInfo,
            availableSlots
        );
    }
}
