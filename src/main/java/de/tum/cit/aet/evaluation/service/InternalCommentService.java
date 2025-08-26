package de.tum.cit.aet.evaluation.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.evaluation.dto.InternalCommentDTO;
import de.tum.cit.aet.evaluation.dto.InternalCommentUpdateDTO;
import de.tum.cit.aet.evaluation.repository.ApplicationEvaluationRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class InternalCommentService {

    private final CurrentUserService currentUserService;
    private final ApplicationEvaluationRepository applicationEvaluationRepository;
    private final InternalCommentRepository internalCommentRepository;

    /**
     * Retrieves all internal comments for the specified application,
     * ordered by creation date ascending.
     *
     * @param applicationId the UUID of the application
     * @return a list of {@link InternalCommentDTO}
     */
    public List<InternalCommentDTO> getComments(UUID applicationId) {
        Application application = getApplication(applicationId);
        authorizeReview(application);
        List<InternalComment> comments = internalCommentRepository.findAllByApplicationApplicationIdOrderByCreatedAtAsc(applicationId);

        User currentUser = currentUserService.getUser();

        return comments.stream().map(comment -> InternalCommentDTO.from(comment, currentUser)).collect(Collectors.toList());
    }

    /**
     * Creates and persists a new internal comment for the specified application.
     *
     * @param applicationId the UUID of the application
     * @param internalCommentUpdateDTO the comment data
     * @return the created {@link InternalCommentDTO}
     */
    public InternalCommentDTO createComment(UUID applicationId, InternalCommentUpdateDTO internalCommentUpdateDTO) {
        Application application = getApplication(applicationId);
        authorizeReview(application);

        User currentUser = currentUserService.getUser();
        InternalComment comment = new InternalComment();
        comment.setApplication(application);
        comment.setMessage(internalCommentUpdateDTO.message());
        comment.setCreatedBy(currentUser);

        return InternalCommentDTO.from(internalCommentRepository.save(comment), currentUser);
    }

    /**
     * Updates the message of an existing internal comment.
     *
     * @param internalCommentId the UUID of the comment
     * @param internalCommentUpdateDTO the updated comment data
     * @return the updated {@link InternalCommentDTO}
     */
    public InternalCommentDTO updateComment(UUID internalCommentId, InternalCommentUpdateDTO internalCommentUpdateDTO) {
        InternalComment comment = getInternalComment(internalCommentId);
        checkOwnership(comment);

        comment.setMessage(internalCommentUpdateDTO.message());
        return InternalCommentDTO.from(internalCommentRepository.save(comment), currentUserService.getUser());
    }

    /**
     * Deletes the internal comment with the given identifier.
     *
     * @param internalCommentId the UUID of the comment
     */
    public void deleteComment(UUID internalCommentId) {
        InternalComment comment = getInternalComment(internalCommentId);
        checkOwnership(comment);
        internalCommentRepository.delete(comment);
    }

    /**
     * Retrieves an internal comment by its identifier.
     *
     * @param internalCommentId the UUID of the comment
     * @return the {@link InternalComment} entity
     */
    private InternalComment getInternalComment(UUID internalCommentId) {
        return internalCommentRepository.findById(internalCommentId).orElseThrow(() -> EntityNotFoundException.forId("InternalComment", internalCommentId));
    }

    /**
     * Verifies that the current user is the creator of the given comment.
     *
     * @param comment the {@link InternalComment} to check ownership for
     */
    private void checkOwnership(InternalComment comment) {
        if (!currentUserService.isCurrentUser(comment.getCreatedBy().getUserId())) {
            throw new AccessDeniedException("Current user is not authorized");
        }
    }

    /**
     * Ensures that the current user has review permissions for the given application.
     *
     * @param application the {@link Application} to check
     */
    private void authorizeReview(Application application) {
        currentUserService.assertAccessTo(application.getJob().getResearchGroup());
    }

    /**
     * Retrieves an application by its identifier.
     *
     * @param applicationId the UUID of the application
     * @return the {@link Application} entity
     */
    private Application getApplication(UUID applicationId) {
        return applicationEvaluationRepository.findById(applicationId).orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));
    }

}
