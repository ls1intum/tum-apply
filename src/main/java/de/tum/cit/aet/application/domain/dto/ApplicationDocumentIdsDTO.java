package de.tum.cit.aet.application.domain.dto;

import java.util.Set;
import java.util.UUID;
import lombok.Data;

@Data
public class ApplicationDocumentIdsDTO {

    private Set<UUID> bachelorDocumentIds;
    private Set<UUID> masterDocumentIds;
    private Set<UUID> referenceDocumentIds;
    private UUID cvDocumentId;
}
