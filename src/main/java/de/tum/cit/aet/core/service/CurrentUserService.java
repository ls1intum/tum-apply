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
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        if (currentUser==null) {
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
        if (user==null) {
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
            .map(r -> new ResearchGroupRole(r.getRole(), r.getResearchGroup()!=null ? r.getResearchGroup().getResearchGroupId():null))
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
     * Returns the current user's ID if available.
     *
     * @return an {@link Optional} containing the user ID, or empty if access is denied
     */
    public Optional<UUID> getUserIdIfAvailable() {
        try {
            return Optional.of(getUserId());
        } catch (AccessDeniedException e) {
            return Optional.empty();
        }
    }

    /**
     * Returns the research group ID if the current user is a professor.
     *
     * @return the research group ID if user is a professor
     * @throws AccessDeniedException if the user is not a professor or has no research group
     */
    public UUID getResearchGroupIdIfProfessor() {
        return getCurrentUser()
            .getResearchGroupIdIfProfessor()
            .orElseThrow(() -> new AccessDeniedException("Current User does not have a research group"));
    }

    /**
     * Returns the research group if the current user is a professor.
     *
     * @return the research group ID if user is a professor
     * @throws AccessDeniedException if the user is not a professor or has no research group
     */
    public ResearchGroup getResearchGroupIfProfessor() {
        return Optional.ofNullable(getUser().getResearchGroup()).orElseThrow(() ->
            new AccessDeniedException("Current User does not have a research group")
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
     * @throws AccessDeniedException if the current user does not belong to the research group
     */
    public void isAdminOrMemberOf(UUID researchGroupId) {
        if (isAdmin() || getCurrentUser().getResearchGroupIdIfProfessor().map(id -> id.equals(researchGroupId)).orElse(false)) {
            return;
        }
        throw new AccessDeniedException("User has no access to the research group");
    }

    /**
     * Checks whether the current user is either an admin or is a professor of the given research group.
     *
     * @param researchGroup the research group to check
     */
    public void isAdminOrMemberOf(ResearchGroup researchGroup) {
        if (researchGroup==null) {
            return;
        }
        isAdminOrMemberOf(researchGroup.getResearchGroupId());
    }

    /**
     * Checks whether the current user is either an admin or is a professor of the same research group
     * as the given professor identified by their user ID.
     *
     * @param professor the professor of whom the research group is to be checked
     * @throws AccessDeniedException if the professor cannot be found or has no research group
     */
    public void isAdminOrMemberOfResearchGroupOfProfessor(User professor) {
        if (professor==null) {
            throw new AccessDeniedException("Professor not found");
        }
        if (isAdmin()) {
            return;
        }
        if (professor.getResearchGroup()==null) {
            throw new AccessDeniedException("Professor does not belong to a research group");
        }
        isAdminOrMemberOf(professor.getResearchGroup().getResearchGroupId());
    }

    /**
     * Checks whether the given userId matches the current user or the current user is an admin.
     *
     * @param userId the user ID to check
     */
    public void isCurrentUserOrAdmin(UUID userId) {
        boolean success = isAdmin() || getUserId().equals(userId);
        if (!success) {
            throw new AccessDeniedException("User is neither the owner nor an admin");
        }
    }

    /**
     * Asserts that the current user has access to the given entity.
     * Throws AccessDeniedException if access is denied.
     *
     * @param entity the entity to check
     */
    public void assertAccessTo(Object entity) {
        switch (entity) {
            case Application app -> hasAccessTo(app);
            case ApplicationReview review -> hasAccessTo(review);
            case CustomFieldAnswer answer -> hasAccessTo(answer);
            case ResearchGroup group -> hasAccessTo(group);
            case Job job -> hasAccessTo(job);
            case InternalComment comment -> hasAccessTo(comment);
            case EmailTemplate emailTemplate -> hasAccessTo(emailTemplate);
            default -> throw new AccessDeniedException("Access denied to entity: " + entity.getClass().getSimpleName());
        }
    }

    /**
     * Checks if the current user has access to the given application.
     * The user must either be the applicant or an admin.
     *
     * @param application the application to check
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccessTo(Application application) {
        isCurrentUserOrAdmin(application.getApplicant().getUserId());
    }

    /**
     * Checks if the current user has access to the given application review.
     * The user must be an admin or professor of the associated research group.
     *
     * @param review the application review to check
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccessTo(ApplicationReview review) {
        isAdminOrMemberOf(review.getApplication().getJob().getResearchGroup().getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given custom field answer.
     * The user must be an admin, professor of the research group, or the applicant.
     *
     * @param answer the custom field answer to check
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccessTo(CustomFieldAnswer answer) {
        Application application = answer.getApplication();

        isAdminOrMemberOf(application.getJob().getResearchGroup().getResearchGroupId());
        isCurrentUserOrAdmin(application.getApplicant().getUserId());
    }

    /**
     * Checks if the current user has access to the given research group.
     * The user must be an admin or professor of the group.
     *
     * @param researchGroup the research group to check
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccessTo(ResearchGroup researchGroup) {
        isAdminOrMemberOf(researchGroup.getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given job posting.
     * The user must be an admin or professor of the associated research group.
     *
     * @param job the job posting to check
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccessTo(Job job) {
        isAdminOrMemberOf(job.getResearchGroup().getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given internal comment.
     * The user must be an admin or professor of the associated research group.
     *
     * @param comment the internal comment to check
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccessTo(InternalComment comment) {
        isAdminOrMemberOf(comment.getApplication().getJob().getResearchGroup().getResearchGroupId());
    }

    /**
     * Checks if the current user has access to the given internal email template.
     * The user must be an admin or professor of the associated research group.
     *
     * @param emailTemplate the email template to check
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccessTo(EmailTemplate emailTemplate) {
        isAdminOrMemberOf(emailTemplate.getResearchGroup().getResearchGroupId());
    }
}
