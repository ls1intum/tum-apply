package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.usermanagement.domain.User;
import lombok.NonNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record InternalCommentDTO(
    UUID commentId,
    String author,
    String message,
    LocalDateTime createdAt,
    boolean canEdit
) {
    /**
     * Creates a DTO representation of an internal comment for the given user context.
     *
     * The {@code editable} flag is set to {@code true} if the current user is the
     * author of the comment.
     *
     * @param comment     the {@link InternalComment} entity to convert
     * @param currentUser the currently authenticated {@link User}
     * @return a new {@link InternalCommentDTO} instance
     */
    public static InternalCommentDTO from(@NonNull InternalComment comment, @NonNull User currentUser) {
        User author = comment.getCreatedBy();
        return new InternalCommentDTO(
            comment.getInternalCommentId(),
            author.getFirstName() + " " + author.getLastName(),
            comment.getMessage(),
            comment.getCreatedAt(),
            author.getUserId().equals(currentUser.getUserId()));
    }
}
