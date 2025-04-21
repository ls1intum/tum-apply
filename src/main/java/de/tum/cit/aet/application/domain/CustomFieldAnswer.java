package de.tum.cit.aet.application.domain;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.converter.StringListConverter;
import de.tum.cit.aet.job.domain.CustomField;
import jakarta.persistence.*;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "custom_field_answers")
public class CustomFieldAnswer {

    @Id
    @Column(name = "custom_field_answer_id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID customFieldAnswerId;

    @ManyToOne
    @JoinColumn(name = "custom_field_id")
    private CustomField customField;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private Application application;

    @Convert(converter = StringListConverter.class)
    private List<String> answers;

    @OneToMany(mappedBy = "customFieldAnswer", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Document> documents;
}
