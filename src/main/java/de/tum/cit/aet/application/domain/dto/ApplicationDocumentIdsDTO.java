package de.tum.cit.aet.application.domain.dto;

import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ApplicationDocumentIdsDTO {

    private List<UUID> bachelorDocumentIds;
    private List<UUID> masterDocumentIds;
    private List<UUID> referenceDocumentIds;
    private UUID cvDocumentId;
}
