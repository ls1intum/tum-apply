package de.tum.cit.aet.core.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.util.UUID;

/** Placeholder class for Application. */
@Entity
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID applicationId;
}
