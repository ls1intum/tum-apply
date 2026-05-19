package de.tum.cit.aet.reference.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Wakes the {@link ReferenceRequestService} once a day to update the token status and deliver reminder emails
 * for referees whose upload window is about to close.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReferenceLetterReminderJob {

    private final ReferenceRequestService referenceRequestService;

    /**
     * Performs two passes:
     * 1) Flip every {@code REQUESTED} entry past its deadline to {@code EXPIRED}.
     * 2) Send reminder emails for entries whose deadline is approaching.
     */
    @Scheduled(cron = "${aet.reference.reminder.cron:0 0 0 * * *}", zone = "UTC")
    public void run() {
        int expired = referenceRequestService.expireOverdueRequests();
        if (expired > 0) {
            log.info("Reference letter requests transitioned to EXPIRED: {}", expired);
        }
        int sent = referenceRequestService.sendReminders();
        if (sent > 0) {
            log.info("Reference letter reminders sent: {}", sent);
        }
    }
}
