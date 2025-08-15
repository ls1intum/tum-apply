package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.domain.CurrentUser;
import de.tum.cit.aet.core.domain.ResearchGroupRole;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.context.WebApplicationContext;

@Service
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    private User user;

    private CurrentUser currentUser;

    /**
     * Returns the current authenticated user as a DTO.
     * Loads the user from the security context if not already loaded.
     *
     * @return the current user as a {@link CurrentUser} object
     */
    public CurrentUser getCurrentUser() {
        if (currentUser == null) {
            loadCurrentUser();
        }
        return currentUser;
    }

    /**
     * Returns the current authenticated user as an entity.
     * Loads the user from the security context if not already loaded.
     *
     * @return the current user as a {@link User} entity
     */
    public User getUser() {
        if (user == null) {
            loadCurrentUser();
        }
        return user;
    }

    /**
     * Loads the current authenticated user from the security context.
     * Initializes the {@link User} entity and the {@link CurrentUser} DTO.
     *
     * @throws AccessDeniedException if the user cannot be resolved from the security context
     */
    private void loadCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtToken)) {
            throw new AccessDeniedException("Cannot extract user ID from authentication.");
        }
        UUID userId = UUID.fromString(jwtToken.getToken().getSubject());

        User user = userRepository
            .findWithResearchGroupRolesByUserId(userId)
            .orElseThrow(() -> new AccessDeniedException("User not found"));

        List<ResearchGroupRole> roles = user
            .getResearchGroupRoles()
            .stream()
            .map(r -> new ResearchGroupRole(r.getRole(), r.getResearchGroup() != null ? r.getResearchGroup().getResearchGroupId() : null))
            .toList();

        this.user = user;
        this.currentUser = new CurrentUser(user.getUserId(), user.getEmail(), user.getFirstName(), user.getLastName(), roles);
    }

    /**
     * Returns the ID of the current authenticated user.
     *
     * @return UUID of the user
     */
    public UUID getUserId() {
        return getCurrentUser().userId();
    }

    /**
     * Returns the research group ID if the current user is a professor.
     *
     * @return an Optional containing the research group ID if user is a professor, or empty otherwise
     */
    public UUID getResearchGroupIdIfProfessor() {
        return getCurrentUser()
            .getResearchGroupIdIfProfessor()
            .orElseThrow(() -> new IllegalStateException("Current User does not have a research group"));
    }

    /**
     * Returns the research group if the current user is a professor.
     *
     * @return the research group ID if user is a professor, or throws IllegalStateException
     */
    public ResearchGroup getResearchGroupIfProfessor() {
        return Optional.ofNullable(getUser().getResearchGroup()).orElseThrow(() ->
            new IllegalStateException("Current User does not have a research group")
        );
    }

    /**
     * Checks whether the given userId matches the current user.
     *
     * @param userId the user ID to check
     * @return true if the current user is the given user
     */
    public boolean isCurrentUser(UUID userId) {
        return getUserId().equals(userId);
    }

    /**
     * Checks if the current user has admin privileges.
     *
     * @return true if the user is an admin, false otherwise
     */
    public boolean isAdmin() {
        return getCurrentUser().isAdmin();
    }

    /**
     * Checks if the current user has a professor role.
     *
     * @return true if the user is a professor, false otherwise
     */
    public boolean isProfessor() {
        return getCurrentUser().isProfessor();
    }

    /**
     * Checks whether the current user is either an admin or professor of the specified research group.
     *
     * @param researchGroupId the ID of the research group
     * @return true if the user has access to the group, false otherwise
     */
    public boolean isAdminOrProfessorOf(UUID researchGroupId) {
        return isAdmin() || getResearchGroupIdIfProfessor().equals(researchGroupId);
    }

    /**
     * Checks whether the given userId matches the current user or the current user is an admin.
     *
     * @param userId the user ID to check
     * @return true if the current user is the given user or is an admin
     */
    public boolean isCurrentUserOrAdmin(UUID userId) {
        return isAdmin() || getUserId().equals(userId);
    }

    /**
     * Asserts that the current user has access to the given entity.
     * Throws AccessDeniedException if access is denied.
     *
     * @param entity the entity to check
     */
    public void assertAccessTo(Object entity) {
        boolean hasAccess = switch (entity) {
            case Application app -> hasAccessTo(app);
            case ApplicationReview review -> hasAccessTo(review);
            case CustomFieldAnswer answer -> hasAccessTo(answer);
            case ResearchGroup group -> hasAccessTo(group);
            case Job job -> hasAccessTo(job);
            case InternalComment comment -> hasAccessTo(comment);
            case EmailTemplate emailTemplate -> hasAccessTo(emailTemplate);
            default -> false;
        };

        if (!hasAccess) {
            throw new AccessDeniedException("Access denied to entity: " + entity.getClass().getSimpleName());
        }
    }

    /**
     * Checks if the current user has access to the given application.
     * The user must either be the applicant or an admin.
     *
     * @param application the application to check
     * @return true if access is granted, false otherwise
     */
    private boolean hasAccessTo(Application application) {
        return isCurrentUserOrAdmin(application.getApplicant().getUserId());
    }

    /**
     * Checks if the current user has access to the given application review.
     * The user must be an admin or professor of the associated research group.
     *
     * @param review the application review to check
     * @return true if access is granted, false otherwise
     */
    private boolean hasAccessTo(ApplicationReview review) {
        return isAdminOrProfessorOf(review.getApplication().getJob().getResearchGroup().getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given custom field answer.
     * The user must be an admin, professor of the research group, or the applicant.
     *
     * @param answer the custom field answer to check
     * @return true if access is granted, false otherwise
     */
    private boolean hasAccessTo(CustomFieldAnswer answer) {
        Application application = answer.getApplication();
        return (
            isAdminOrProfessorOf(application.getJob().getResearchGroup().getResearchGroupId()) ||
            isCurrentUserOrAdmin(application.getApplicant().getUserId())
        );
    }

    /**
     * Checks if the current user has access to the given research group.
     * The user must be an admin or professor of the group.
     *
     * @param researchGroup the research group to check
     * @return true if access is granted, false otherwise
     */
    private boolean hasAccessTo(ResearchGroup researchGroup) {
        return isAdminOrProfessorOf(researchGroup.getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given job posting.
     * The user must be an admin or professor of the associated research group.
     *
     * @param job the job posting to check
     * @return true if access is granted, false otherwise
     */
    private boolean hasAccessTo(Job job) {
        return isAdminOrProfessorOf(job.getResearchGroup().getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given internal comment.
     * The user must be an admin or professor of the associated research group.
     *
     * @param comment the internal comment to check
     * @return true if access is granted, false otherwise
     */
    private boolean hasAccessTo(InternalComment comment) {
        return isAdminOrProfessorOf(comment.getApplication().getJob().getResearchGroup().getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given internal email template.
     * The user must be an admin or professor of the associated research group.
     *
     * @param emailTemplate the email template to check
     * @return true if access is granted, false otherwise
     */
    private boolean hasAccessTo(EmailTemplate emailTemplate) {
        return isAdminOrProfessorOf(emailTemplate.getResearchGroup().getResearchGroupId());
    }
}
