package de.tum.cit.aet.application.domain;

import de.tum.cit.aet.application.constants.ApplicationStatus;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
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

    // TODO to uncomment when rest of databases are created
    // @OneToMany(mappedBy = "application")
    // private Set<CustomField> customFields;

    // TODO to uncomment when rest of databases are created
    // @OneToMany(mappedBy = "application")
    // private Set<InternalComment> internalComments;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant created_at;
}
