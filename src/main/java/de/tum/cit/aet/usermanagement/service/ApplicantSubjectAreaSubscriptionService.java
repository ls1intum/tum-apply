package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.application.service.ApplicantService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing applicant subject area subscriptions.
 * Handles loading, adding, and removing individual subject area subscriptions.
 */
@Service
public class ApplicantSubjectAreaSubscriptionService {

    private final ApplicantRepository applicantRepository;
    private final ApplicantService applicantService;
    private final CurrentUserService currentUserService;

    public ApplicantSubjectAreaSubscriptionService(
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
    @Transactional(readOnly = true)
    public List<SubjectArea> getSubscriptionsForCurrentUser() {
        UUID userId = currentUserService.getUserId();
        return applicantRepository
            .findById(userId)
            .map(applicant -> applicant.getSubjectAreaSubscriptions().stream().sorted(Comparator.naturalOrder()).toList())
            .orElseGet(List::of);
    }

    /**
     * Adds a subject area subscription for the authenticated applicant.
     * If the subscription already exists, it is not added again.
     *
     * @param subjectArea the subject area to subscribe to
     * @return the created subscription
     */
    @Transactional
    public SubjectArea addSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();
        Applicant applicant = applicantService.findOrCreateApplicant(userId);
        Set<SubjectArea> subscriptions = applicant.getSubjectAreaSubscriptions();

        if (subscriptions.contains(subjectArea)) {
            return subjectArea;
        }

        subscriptions.add(subjectArea);

        try {
            applicantRepository.saveAndFlush(applicant);
            return subjectArea;
        } catch (DataIntegrityViolationException e) {
            // A concurrent request may have created the same subscription after the existence check.
            return applicantRepository
                .findById(userId)
                .filter(existingApplicant -> existingApplicant.getSubjectAreaSubscriptions().contains(subjectArea))
                .map(_ -> subjectArea)
                .orElseThrow(() -> e);
        }
    }

    /**
     * Removes a subject area subscription for the authenticated applicant.
     *
     * @param subjectArea the subject area to unsubscribe from
     */
    @Transactional
    public void removeSubscription(SubjectArea subjectArea) {
        UUID userId = currentUserService.getUserId();
        applicantRepository
            .findById(userId)
            .filter(applicant -> applicant.getSubjectAreaSubscriptions().remove(subjectArea))
            .ifPresent(applicantRepository::save);
    }
}
