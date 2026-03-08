package de.tum.cit.aet.interview.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.core.domain.export.ExportedUserData;
import de.tum.cit.aet.core.domain.export.UserDataExportProviderType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a time slot for an interview.
 * Each slot can be booked by exactly one interviewee.
 */
@Entity
@ExportedUserData(by = UserDataExportProviderType.STAFF)
@Table(name = "interview_slots")
@NamedEntityGraphs(
    {
        @NamedEntityGraph(
            name = "InterviewSlot.withIntervieweeDetails",
            attributeNodes = { @NamedAttributeNode(value = "interviewee", subgraph = "interviewee-subgraph") },
            subgraphs = {
                @NamedSubgraph(
                    name = "interviewee-subgraph",
                    attributeNodes = { @NamedAttributeNode(value = "application", subgraph = "application-subgraph") }
                ),
                @NamedSubgraph(
                    name = "application-subgraph",
                    attributeNodes = { @NamedAttributeNode(value = "applicant", subgraph = "applicant-subgraph") }
                ),
                @NamedSubgraph(name = "applicant-subgraph", attributeNodes = { @NamedAttributeNode(value = "user") }),
            }
        ),
        @NamedEntityGraph(
            name = "InterviewSlot.withProcessJobDetails",
            attributeNodes = { @NamedAttributeNode(value = "interviewProcess", subgraph = "process-job-subgraph") },
            subgraphs = {
                @NamedSubgraph(
                    name = "process-job-subgraph",
                    attributeNodes = { @NamedAttributeNode(value = "job", subgraph = "job-research-group-subgraph") }
                ),
                @NamedSubgraph(name = "job-research-group-subgraph", attributeNodes = { @NamedAttributeNode(value = "researchGroup") }),
            }
        ),
    }
)
@Getter
@Setter
public class InterviewSlot extends AbstractAuditingEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_process_id", nullable = false)
    private InterviewProcess interviewProcess;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewee_id")
    private Interviewee interviewee;

    @NotNull
    @Column(name = "start_date_time", nullable = false)
    private Instant startDateTime;

    @NotNull
    @Column(name = "end_date_time", nullable = false)
    private Instant endDateTime;

    @NotNull
    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "stream_link")
    private String streamLink;

    @Column(name = "is_booked", nullable = false)
    private Boolean isBooked = false;

    @Version
    @Column(name = "version")
    private Long version;
}
