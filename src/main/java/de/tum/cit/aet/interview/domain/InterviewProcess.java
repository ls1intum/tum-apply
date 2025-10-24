package de.tum.cit.aet.interview.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.job.domain.Job;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "interview_processes")
public class InterviewProcess extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;
}
