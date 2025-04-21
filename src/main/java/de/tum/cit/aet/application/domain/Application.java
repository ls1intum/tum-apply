package de.tum.cit.aet.application.domain;

import de.tum.cit.aet.application.constants.ApplicationStatus;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@Setter
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @OneToOne
    @JoinColumn(name = "application_review_id")
    private ApplicationReview applicationReview;

    @ManyToOne
    @JoinColumn(name = "submitted_by")
    private Applicant submittedBy;

    @ManyToOne
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(name = "motivation")
    private String motivation;

    @Column(name = "application_status")
    private ApplicationStatus status;

    @Column(name = "desired_start_date")
    private Instant desiredStartDate;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "application")
    private Set<CustomField> customFields;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "application")
    private Set<InternalComment> internalComments;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}
