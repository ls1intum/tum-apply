package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.job.domain.Job;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A user.
 */
@Getter
@Setter
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
public class User extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne
    @JoinColumn(name = "research_group_id")
    private ResearchGroup researchGroup;

    // Contains all the Jobs that a User (Professor) has posted
    @OneToMany(mappedBy = "postedBy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Job> postedJobs;

    @Column(name = "email")
    private String email;

    @Column(name = "avatar_file_id")
    private UUID avatar_file_id;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "gender")
    private String gender;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "website")
    private String website;

    @Column(name = "tum_student")
    private Boolean tumStudent;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
