package de.tum.cit.aet.job.domain;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.domain.converter.StringListConverter;
import de.tum.cit.aet.job.constants.CustomFieldType;
import jakarta.persistence.*;
import java.util.List;
import java.util.Set;
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
    @Column(name = "custom_field_id", nullable = false)
    private UUID customFieldId;

    @ManyToOne
    @JoinColumn(name = "job_id")
    private Job job;

    private int order;

    private CustomFieldType type;

    @Column(name = "is_required")
    private boolean isRequired;

    private String question;

    @Convert(converter = StringListConverter.class)
    @Column(name = "answer_options")
    private List<String> answerOptions;

    @OneToMany(mappedBy = "customField", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CustomFieldAnswer> customFieldAnswers;
}
