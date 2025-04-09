package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.State;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * A Job.
 */
@Getter
@Setter
@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    private User postedBy;

    //TODO: Uncomment when Application Entity is implemented
    // Contains all the Applications that are submitted to this Job
    //    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    //    private List<Application> applications;

    @Column(name = "field_of_studies")
    private String fieldOfStudies;

    @Column(name = "title")
    private String title;

    @Column(name = "introduction")
    private String introduction;

    @Column(name = "about_us")
    private String aboutUs;

    @Column(name = "tasks")
    private String tasks;

    @Column(name = "qualifications")
    private String qualifications;

    @Column(name = "we_offer")
    private String weOffer;

    @Column(name = "application_requirements")
    private String applicationRequirements;

    @Column(name = "data_protection_information")
    private String dataProtectionInformation;

    @Column(name = "contact")
    private String contact;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private State state;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "application_deadline")
    private Instant applicationDeadline;

    @CreationTimestamp
    @NotNull
    @Column(name = "created_at", nullable = false)
    private String createdAt;

    @UpdateTimestamp
    @Column(name = "last_updated")
    private String lastUpdated;
}
