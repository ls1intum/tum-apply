package de.tum.cit.aet.application.domain.dto;

import java.util.Set;
import java.util.UUID;
import lombok.Data;

@Data
public class ApplicationDocumentIdsDTO {

    private Set<UUID> bachelorDocumentDictionaryIds;

    private Set<UUID> masterDocumentDictionaryIds;

    private Set<UUID> referenceDocumentDictionaryIds;

    private UUID cvDocumentDictionaryId;
}
