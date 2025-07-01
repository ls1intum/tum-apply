package de.tum.cit.aet.evaluation.dto;

import jakarta.validation.constraints.Size;

public record AcceptDTO(
    @Size(max = 3000, message = "Message can not exceed 3000 characters") String message,
    boolean notifyApplicant,
    boolean closeJob
) {}
