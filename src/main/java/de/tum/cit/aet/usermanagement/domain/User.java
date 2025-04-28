package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.job.domain.Job;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.HashSet;
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

    @Column(name = "email")
    private String email;

    @Column(name = "avatar")
    private String avatar;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "gender")
    private String gender;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "website")
    private String website;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "selected_language", nullable = false)
    private String selectedLanguage;

    // Contains all the Jobs that a User (Professor) has posted
    @OneToMany(mappedBy = "supervisingProfessor", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Job> postedJobs = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserResearchGroupRole> researchGroupRoles = new HashSet<>();
}
