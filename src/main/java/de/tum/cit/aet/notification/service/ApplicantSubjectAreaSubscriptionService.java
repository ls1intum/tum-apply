package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.application.service.ApplicantService;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.InvalidParameterException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.notification.domain.ApplicantSubjectAreaSubscription;
import de.tum.cit.aet.notification.dto.ApplicantSubjectAreaSubscriptionDTO;
import de.tum.cit.aet.notification.repository.ApplicantSubjectAreaSubscriptionRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles loading and replacing subject-area subscriptions for the current applicant.
 *
 * <p>The update flow replaces the complete subscription set in one transaction so
 * callers can treat the API like a full preference update instead of patching
 * individual rows.</p>
 */
@Service
@RequiredArgsConstructor
public class ApplicantSubjectAreaSubscriptionService {

    private final ApplicantSubjectAreaSubscriptionRepository applicantSubjectAreaSubscriptionRepository;
    private final ApplicantService applicantService;
    private final CurrentUserService currentUserService;

    /**
     * Loads the current applicant's saved subject-area subscriptions.
     *
     * @return normalized DTO containing the applicant's current subscriptions
     */
    public ApplicantSubjectAreaSubscriptionDTO getCurrentApplicantSubscriptions() {
        Applicant applicant = getCurrentApplicant();
        List<ApplicantSubjectAreaSubscription> subscriptions =
            applicantSubjectAreaSubscriptionRepository.findAllByApplicantOrderBySubjectAreaAsc(applicant);
        return ApplicantSubjectAreaSubscriptionDTO.fromEntities(subscriptions);
    }

    /**
     * Replaces the current applicant's complete subject-area subscription set.
     *
     * <p>Input is validated, deduplicated, and sorted before persistence so the
     * returned DTO always has a stable shape.</p>
     *
     * @param dto new subscription state for the current applicant
     * @return normalized DTO containing the persisted subscriptions
     */
    @Transactional
    public ApplicantSubjectAreaSubscriptionDTO updateCurrentApplicantSubscriptions(ApplicantSubjectAreaSubscriptionDTO dto) {
        Applicant applicant = getCurrentApplicant();
        List<SubjectArea> normalizedSubjectAreas = normalizeSubjectAreas(dto);

        applicantSubjectAreaSubscriptionRepository.deleteByApplicant(applicant);

        if (normalizedSubjectAreas.isEmpty()) {
            return new ApplicantSubjectAreaSubscriptionDTO(List.of());
        }

        List<ApplicantSubjectAreaSubscription> subscriptionsToSave = normalizedSubjectAreas
            .stream()
            .map(subjectArea -> {
                ApplicantSubjectAreaSubscription subscription = new ApplicantSubjectAreaSubscription();
                subscription.setApplicant(applicant);
                subscription.setSubjectArea(subjectArea);
                return subscription;
            })
            .toList();

        List<ApplicantSubjectAreaSubscription> savedSubscriptions = applicantSubjectAreaSubscriptionRepository.saveAll(subscriptionsToSave);
        return ApplicantSubjectAreaSubscriptionDTO.fromEntities(savedSubscriptions);
    }

    /**
     * Resolves the current user as an applicant and creates the applicant profile
     * on demand if it does not exist yet.
     *
     * @return current applicant entity
     * @throws AccessDeniedException when the current user does not have the applicant role
     * @throws InvalidParameterException when no current user id can be resolved
     */
    private Applicant getCurrentApplicant() {
        if (
            currentUserService
                .getCurrentUser()
                .researchGroupRoles()
                .stream()
                .noneMatch(role -> role.role() == UserRole.APPLICANT)
        ) {
            throw new AccessDeniedException("Only applicants can manage subject-area subscriptions");
        }

        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        return applicantService.findOrCreateApplicant(userId);
    }

    /**
     * Validates and normalizes a subscription payload before persistence.
     *
     * @param dto payload to validate
     * @return distinct subject areas sorted by enum name
     * @throws InvalidParameterException when the payload or any entry is null
     */
    private List<SubjectArea> normalizeSubjectAreas(ApplicantSubjectAreaSubscriptionDTO dto) {
        if (dto == null) {
            throw new InvalidParameterException("Subscription payload must not be null.");
        }

        List<SubjectArea> subjectAreas = dto.subjectAreas();
        if (subjectAreas == null) {
            throw new InvalidParameterException("Subject areas must not be null.");
        }

        if (subjectAreas.stream().anyMatch(subjectArea -> subjectArea == null)) {
            throw new InvalidParameterException("Subject areas must not contain null values.");
        }

        return subjectAreas.stream().distinct().sorted(Comparator.comparing(Enum::name)).toList();
    }
}
