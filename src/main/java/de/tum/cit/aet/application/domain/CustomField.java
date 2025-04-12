package de.tum.cit.aet.application.domain;

import de.tum.cit.aet.core.domain.Document;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "custom_fields")
public class CustomField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID customFieldId;

    @ManyToOne
    @JoinColumn(name = "application")
    private Application application;

    private String question;

    private boolean isRequired;

    @OneToOne
    @JoinColumn(name = "document")
    private Document document;
    // TODO what fields to use to enable dynamic questions need to be discussed
}
