package de.tum.cit.aet.interview.web;

import de.tum.cit.aet.core.security.annotations.Applicant;
import de.tum.cit.aet.interview.dto.BookingDTO;
import de.tum.cit.aet.interview.service.InterviewBookingService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for applicant facing interview booking operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/interviews/booking")
@RequiredArgsConstructor
public class InterviewBookingResource {

    private final InterviewBookingService bookingService;

    /**
     * {@code GET /api/interviews/booking/{processId}} :
     * Get booking page data for applicant self-service slot booking.
     *
     * @param processId the ID of the interview process
     * @return booking page data with job info, user's booking status, and available
     *         slots
     */
    @Applicant
    @GetMapping("/{processId}")
    public ResponseEntity<BookingDTO> getBookingData(@PathVariable UUID processId) {
        log.info("REST request to get booking data for process: {}", processId);
        BookingDTO data = bookingService.getBookingData(processId);
        return ResponseEntity.ok(data);
    }
}
