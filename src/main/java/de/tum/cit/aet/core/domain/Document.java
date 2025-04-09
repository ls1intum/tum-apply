package de.tum.cit.aet.core.domain;

import jakarta.persistence.*;
import java.util.UUID;

/** Placeholder class for Document. */
@Entity
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID documentId;
    //TODO: store an applicant_id to map documents to applicants
}
