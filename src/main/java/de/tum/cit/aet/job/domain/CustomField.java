package de.tum.cit.aet.job.domain;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.domain.converter.StringListConverter;
import de.tum.cit.aet.job.constants.CustomFieldType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "question", nullable = false)
    private String question;

    @Column(name = "is_required", nullable = false)
    private boolean isRequired;

    @Column(name = "custom_field_type", nullable = false)
    private CustomFieldType customFieldType;

    @Convert(converter = StringListConverter.class)
    @Column(name = "answer_options")
    private List<String> answerOptions;

    @Column(name = "sequence")
    private int sequence;

    @OneToMany(mappedBy = "customField", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CustomFieldAnswer> customFieldAnswers;
}
