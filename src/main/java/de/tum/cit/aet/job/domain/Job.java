package de.tum.cit.aet.job.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.job.constants.State;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A Job.
 */
@Getter
@Setter
@Entity
@Table(name = "jobs")
public class Job extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    private User postedBy;

    // Contains all the Applications that are submitted to this Job
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Application> applications;

    @Column(name = "field_of_studies")
    private String fieldOfStudies;

    @Column(name = "research_area")
    private String researchArea;

    @Column(name = "location")
    private String location;

    @Column(name = "employment_type")
    private String employmentType;

    @Column(name = "workload")
    private int workload;

    @Column(name = "contract_duration")
    private int contractDuration;

    @Column(name = "funding_type")
    private String fundingType;

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

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone_number")
    private String contactPhoneNumber;

    @Column(name = "contact_website")
    private String contactWebsite;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private State state;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "application_deadline")
    private Instant applicationDeadline;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<CustomField> customFields;
}
