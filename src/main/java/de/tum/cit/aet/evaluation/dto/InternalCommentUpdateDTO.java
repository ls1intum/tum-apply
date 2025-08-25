package de.tum.cit.aet.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InternalCommentUpdateDTO(
    @NotBlank(message = "Comment message must not be blank")
    @Size(max = 500, message = "Comment message must not exceed 500 characters")
    String message
) {
}
