package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ApplicantSubjectAreaSubscription;
import de.tum.cit.aet.usermanagement.dto.ApplicantSubjectAreaSubscriptionDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ApplicantSubjectAreaSubscriptionRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for managing applicant subject area subscriptions.
 * Handles loading, adding, and removing individual subject area subscriptions.
 */
@Slf4j
@Service
public class ApplicantSubjectAreaSubscriptionService {

    private final ApplicantSubjectAreaSubscriptionRepository subscriptionRepository;
    private final ApplicantRepository applicantRepository;
    private final CurrentUserService currentUserService;

    public ApplicantSubjectAreaSubscriptionService(
        ApplicantSubjectAreaSubscriptionRepository subscriptionRepository,
        ApplicantRepository applicantRepository,
        CurrentUserService currentUserService
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.applicantRepository = applicantRepository;
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
            .collect(Collectors.toList());
    }

    /**
     * Adds a subject area subscription for the authenticated applicant.
     * If the subscription already exists, it is not added again.
     *
     * @param subjectArea the subject area to subscribe to
     * @return the created subscription DTO
     */
    public ApplicantSubjectAreaSubscriptionDTO addSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();

        // Check if subscription already exists
        if (subscriptionRepository.existsByApplicantUserIdAndSubjectArea(userId, subjectArea)) {
            ApplicantSubjectAreaSubscription existing = subscriptionRepository
                .findByApplicantUserId(userId)
                .stream()
                .filter(s -> s.getSubjectArea() == subjectArea)
                .findFirst()
                .orElseThrow();
            return ApplicantSubjectAreaSubscriptionDTO.getFromEntity(existing);
        }

        // Get applicant and save subscription
        Applicant applicant = applicantRepository.findById(userId).orElseThrow();

        ApplicantSubjectAreaSubscription subscription = new ApplicantSubjectAreaSubscription(applicant, subjectArea);
        subscriptionRepository.save(subscription);

        return ApplicantSubjectAreaSubscriptionDTO.getFromEntity(subscription);
    }

    /**
     * Removes a subject area subscription for the authenticated applicant.
     *
     * @param subjectArea the subject area to unsubscribe from
     */
    public void removeSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();
        subscriptionRepository.deleteByApplicantUserIdAndSubjectArea(userId, subjectArea);
    }
}
