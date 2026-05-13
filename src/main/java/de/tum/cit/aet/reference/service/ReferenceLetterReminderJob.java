package de.tum.cit.aet.reference.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Wakes the {@link ReferenceRequestService} once a day to deliver reminder emails for referees whose
 * upload window is about to close. Kept as a thin scheduling shim so the reminder logic itself stays
 * in the service layer and remains directly callable from tests.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReferenceLetterReminderJob {

    private final ReferenceRequestService referenceRequestService;

    /**
     * Runs daily at 04:15 UTC by default. The cron expression is overridable so test environments
     * can speed it up or disable it entirely.
     */
    @Scheduled(cron = "${aet.reference.reminder.cron:0 15 4 * * *}", zone = "UTC")
    public void sendReminders() {
        int sent = referenceRequestService.sendReminders();
        if (sent > 0) {
            log.info("Reference letter reminders sent: {}", sent);
        }
    }
}
