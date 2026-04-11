package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DocumentType;
import java.util.UUID;

/**
 * Reference to a stored document, capturing only the metadata callers need to
 * locate the binary inside an export archive (or any other content addressable
 * store). The {@code zipPath} is optional and points to the file's location
 * inside an export ZIP — leave it {@code null} when the DTO is used outside an
 * export.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DocumentRefDTO(UUID documentId, String name, DocumentType documentType, String mimeType, Long sizeBytes, String zipPath) {}
