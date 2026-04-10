package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DocumentType;
import java.util.UUID;

/**
 * Reference to an applicant document inside the export ZIP. {@code zipPath}
 * points to the location of the actual file within this archive (e.g.
 * {@code documents/cv.pdf}), which lets a re-importer pair the JSON entry
 * with the binary on disk.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminDocumentRefDTO(
    UUID documentId,
    String name,
    DocumentType documentType,
    String mimeType,
    Long sizeBytes,
    String zipPath
) {}
