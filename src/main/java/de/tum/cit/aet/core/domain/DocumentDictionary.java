package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class DocumentDictionary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "document_dictionary_id", nullable = false, updatable = false)
    private UUID documentDictionaryId;

    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne
    @JoinColumn(name = "applicant_id")
    private Applicant applicant;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private Application application;

    @ManyToOne
    @JoinColumn(name = "custom_field_answer_id")
    private CustomFieldAnswer customFieldAnswer;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;
}
