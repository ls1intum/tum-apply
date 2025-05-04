package de.tum.cit.aet.application.domain;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "applications")
public class Application extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private ApplicationReview applicationReview;

    @ManyToOne
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "application_state", nullable = false)
    @Enumerated(EnumType.STRING)
    private ApplicationState state;

    @Column(name = "desired_start_date")
    private LocalDate desiredStartDate;

    @OneToOne
    @JoinColumn(name = "cv_file_id")
    private Document cvFile;

    @OneToOne
    @JoinColumn(name = "reference_file_id")
    private Document referenceFile;

    @OneToOne
    @JoinColumn(name = "bachelor_certificate_id")
    private Document bachelorCertificate;

    @OneToOne
    @JoinColumn(name = "master_certificate_id")
    private Document masterCertificate;

    @Column(name = "projects")
    private String projects;

    @Column(name = "special_skills")
    private String specialSkills;

    @Column(name = "motivation")
    private String motivation;

    @Column(name = "rating")
    private Integer rating;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "application")
    private Set<CustomFieldAnswer> customFieldAnswers;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "application")
    private Set<InternalComment> internalComments;
}
