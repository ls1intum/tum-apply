package de.tum.cit.aet.job.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.time.LocalDate;
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
    @JoinColumn(name = "professor_id", nullable = false)
    private User supervisingProfessor;

    @ManyToOne
    @JoinColumn(name = "research_group_id", nullable = false)
    private ResearchGroup researchGroup;

    //TODO will be an enum
    @Column(name = "field_of_studies")
    private String fieldOfStudies;

    @Column(name = "research_area")
    private String researchArea;

    @Enumerated(EnumType.STRING)
    @Column(name = "location", nullable = false)
    private Campus location;

    @Column(name = "workload")
    private Integer workload;

    @Column(name = "contract_duration")
    private Integer contractDuration;

    @Enumerated(EnumType.STRING)
    @Column(name = "funding_type", nullable = false)
    private FundingType fundingType;

    @Column(name = "title")
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "tasks")
    private String tasks;

    @Column(name = "requirements")
    private String requirements;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private JobState state;

    @Column(name = "start_date")
    private LocalDate startDate;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<CustomField> customFields;

    // Contains all the Applications that are submitted to this Job
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Application> applications;
}
