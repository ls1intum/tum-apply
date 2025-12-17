package de.tum.cit.aet.core.dto.exportdata;

import de.tum.cit.aet.core.constants.DocumentType;
import java.util.UUID;

public record DocumentExportDTO(UUID documentId, String name, DocumentType documentType, String mimeType, long size) {}
