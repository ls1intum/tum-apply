package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.application.service.ApplicantService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.SubjectArea;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for managing applicant subject area subscriptions.
 * Handles loading, adding, and removing individual subject area subscriptions.
 */
@Service
public class SubjectAreaSubscriptionService {

    private final JdbcTemplate jdbcTemplate;
    private final ApplicantService applicantService;
    private final CurrentUserService currentUserService;

    public SubjectAreaSubscriptionService(
        JdbcTemplate jdbcTemplate,
        ApplicantService applicantService,
        CurrentUserService currentUserService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.applicantService = applicantService;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves all subject area subscriptions for the authenticated applicant.
     *
     * @return list of subscriptions for the current user; empty list if none exist
     */
    public List<SubjectArea> getSubscriptionsForCurrentUser() {
        UUID userId = currentUserService.getUserId();
        return jdbcTemplate
            .queryForList(
                "SELECT subject_area FROM applicant_subject_area_subscriptions WHERE user_id = ? ORDER BY subject_area",
                String.class,
                userId.toString()
            )
            .stream()
            .map(SubjectArea::valueOf)
            .toList();
    }

    /**
     * Adds a subject area subscription for the authenticated applicant.
     * If the subscription already exists, it is not added again (INSERT IGNORE).
     *
     * @param subjectArea the subject area to subscribe to
     */
    public void addSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();
        applicantService.findOrCreateApplicant(userId);
        jdbcTemplate.update(
            "INSERT IGNORE INTO applicant_subject_area_subscriptions (user_id, subject_area) VALUES (?, ?)",
            userId.toString(),
            subjectArea.name()
        );
    }

    /**
     * Removes a subject area subscription for the authenticated applicant.
     *
     * @param subjectArea the subject area to unsubscribe from
     */
    public void removeSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();
        jdbcTemplate.update(
            "DELETE FROM applicant_subject_area_subscriptions WHERE user_id = ? AND subject_area = ?",
            userId.toString(),
            subjectArea.name()
        );
    }
}
