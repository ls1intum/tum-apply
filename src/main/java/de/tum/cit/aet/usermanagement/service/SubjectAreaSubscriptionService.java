package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.application.service.ApplicantService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Service for managing applicant subject area subscriptions.
 * Handles loading, adding, and removing individual subject area subscriptions.
 */
@Service
public class SubjectAreaSubscriptionService {

    private final ApplicantRepository applicantRepository;
    private final ApplicantService applicantService;
    private final CurrentUserService currentUserService;

    public SubjectAreaSubscriptionService(
        ApplicantRepository applicantRepository,
        ApplicantService applicantService,
        CurrentUserService currentUserService
    ) {
        this.applicantRepository = applicantRepository;
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
        return applicantRepository.findSubjectAreaSubscriptionsByUserId(userId).stream()
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
        applicantRepository.addSubjectAreaSubscription(userId, subjectArea.name());
    }

    /**
     * Removes a subject area subscription for the authenticated applicant.
     *
     * @param subjectArea the subject area to unsubscribe from
     */
    public void removeSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();
        applicantRepository.removeSubjectAreaSubscription(userId, subjectArea.name());
    }
}
