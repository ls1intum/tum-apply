package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.application.service.ApplicantService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ApplicantSubjectAreaSubscription;
import de.tum.cit.aet.usermanagement.dto.ApplicantSubjectAreaSubscriptionDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantSubjectAreaSubscriptionRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing applicant subject area subscriptions.
 * Handles loading, adding, and removing individual subject area subscriptions.
 */
@Service
public class ApplicantSubjectAreaSubscriptionService {

    private final ApplicantSubjectAreaSubscriptionRepository subscriptionRepository;
    private final ApplicantService applicantService;
    private final CurrentUserService currentUserService;

    public ApplicantSubjectAreaSubscriptionService(
        ApplicantSubjectAreaSubscriptionRepository subscriptionRepository,
        ApplicantService applicantService,
        CurrentUserService currentUserService
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.applicantService = applicantService;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves all subject area subscriptions for the authenticated applicant.
     *
     * @return list of subscription DTOs for the current user; empty list if none exist
     */
    public List<ApplicantSubjectAreaSubscriptionDTO> getSubscriptionsForCurrentUser() {
        UUID userId = currentUserService.getUserId();
        return subscriptionRepository
            .findByApplicantUserId(userId)
            .stream()
            .map(ApplicantSubjectAreaSubscriptionDTO::getFromEntity)
            .toList();
    }

    /**
     * Adds a subject area subscription for the authenticated applicant.
     * If the subscription already exists, it is not added again.
     *
     * @param subjectArea the subject area to subscribe to
     * @return the created subscription DTO
     */
    @Transactional
    public ApplicantSubjectAreaSubscriptionDTO addSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();

        return subscriptionRepository
            .findByApplicantUserIdAndSubjectArea(userId, subjectArea)
            .map(ApplicantSubjectAreaSubscriptionDTO::getFromEntity)
            .orElseGet(() -> {
                Applicant applicant = applicantService.findOrCreateApplicant(userId);
                ApplicantSubjectAreaSubscription subscription = new ApplicantSubjectAreaSubscription(applicant, subjectArea);
                subscriptionRepository.save(subscription);
                return ApplicantSubjectAreaSubscriptionDTO.getFromEntity(subscription);
            });
    }

    /**
     * Removes a subject area subscription for the authenticated applicant.
     *
     * @param subjectArea the subject area to unsubscribe from
     */
    @Transactional
    public void removeSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();
        subscriptionRepository.deleteByApplicantUserIdAndSubjectArea(userId, subjectArea);
    }
}
