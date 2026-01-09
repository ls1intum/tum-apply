package de.tum.cit.aet.interview.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.security.annotations.Applicant;
import de.tum.cit.aet.interview.dto.BookingDTO;
import de.tum.cit.aet.interview.service.InterviewBookingService;
import java.time.YearMonth;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
     * @param year      optional year for month-based slot filtering (requires
     *                  month)
     * @param month     optional month (1-12) for filtering slots (requires year)
     * @param page      pagination page number (default 0)
     * @param size      pagination page size (default 20)
     * @return booking page data with job info, user's booking status, and available
     *         slots
     */
    @Applicant
    @GetMapping("/{processId}")
    public ResponseEntity<BookingDTO> getBookingData(
        @PathVariable UUID processId,
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        // Convert separate year/month to YearMonth (null if either is missing)
        YearMonth yearMonth = (year != null && month != null) ? YearMonth.of(year, month) : null;
        PageDTO pageDTO = new PageDTO(size, page);

        BookingDTO data = bookingService.getBookingData(processId, yearMonth, pageDTO);
        return ResponseEntity.ok(data);
    }
}
