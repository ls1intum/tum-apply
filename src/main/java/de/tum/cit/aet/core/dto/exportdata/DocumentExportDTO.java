package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DocumentType;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DocumentExportDTO(UUID documentId, String name, DocumentType documentType, String mimeType, long size) {}
