package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.evaluation.dto.InternalCommentDTO;
import de.tum.cit.aet.evaluation.dto.InternalCommentUpdateDTO;
import de.tum.cit.aet.evaluation.service.InternalCommentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping(path = "/api")
public class InternalCommentResource {

    private final InternalCommentService internalCommentService;

    /**
     * Retrieves all internal comments for a given application, ordered by creation date.
     *
     * @param applicationId the UUID of the application to fetch comments for
     * @return a {@link ResponseEntity} containing a list of {@link InternalCommentDTO}
     */
    @GetMapping("/applications/{applicationId}/comments")
    public ResponseEntity<List<InternalCommentDTO>> listComments(@PathVariable UUID applicationId) {
        return ResponseEntity.ok(internalCommentService.getComments(applicationId));
    }

    /**
     * Creates a new internal comment for a given application.
     *
     * @param applicationId the UUID of the application to which the comment belongs
     * @param body          the comment payload containing the message (validated)
     * @return a {@link ResponseEntity} with status {@code 201 Created} and the created {@link InternalCommentDTO}
     */
    @PostMapping(path = "/applications/{applicationId}/comments")
    public ResponseEntity<InternalCommentDTO> createComment(@PathVariable UUID applicationId, @Valid @RequestBody InternalCommentUpdateDTO body) {
        InternalCommentDTO created = internalCommentService.createComment(applicationId, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates the message of an existing internal comment.
     *
     * @param commentId the UUID of the comment to update
     * @param body      the updated comment payload (validated)
     * @return a {@link ResponseEntity} containing the updated {@link InternalCommentDTO}
     */
    @PutMapping(path = "/comments/{commentId}")
    public ResponseEntity<InternalCommentDTO> updateComment(@PathVariable UUID commentId, @Valid @RequestBody InternalCommentUpdateDTO body) {
        return ResponseEntity.ok(internalCommentService.updateComment(commentId, body));
    }

    /**
     * Deletes an internal comment by its identifier.
     *
     * @param commentId the UUID of the comment to delete
     * @return a {@link ResponseEntity} with status {@code 204 No Content} if deletion was successful
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        internalCommentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
