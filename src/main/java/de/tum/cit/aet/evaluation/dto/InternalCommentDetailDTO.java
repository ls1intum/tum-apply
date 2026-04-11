package de.tum.cit.aet.evaluation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Flat representation of an {@link InternalComment} that keeps the entity id
 * and the author's user id (rather than a denormalized name string and a UI
 * {@code canEdit} flag), suitable for re-importable JSON dumps. The
 * lighter-weight {@link InternalCommentDTO} is used for UI display.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record InternalCommentDetailDTO(UUID internalCommentId, UUID authorUserId, String message, LocalDateTime createdAt) {
    /**
     * @param comment the entity to convert; may be {@code null}
     * @return a flat DTO, or {@code null} if {@code comment} is {@code null}
     */
    public static InternalCommentDetailDTO getFromEntity(InternalComment comment) {
        if (comment == null) {
            return null;
        }
        return new InternalCommentDetailDTO(
            comment.getInternalCommentId(),
            comment.getCreatedBy() == null ? null : comment.getCreatedBy().getUserId(),
            comment.getMessage(),
            comment.getCreatedAt()
        );
    }
}
