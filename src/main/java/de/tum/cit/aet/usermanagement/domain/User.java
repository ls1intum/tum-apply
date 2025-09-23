package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.domain.EmailSetting;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A user.
 */
@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends AbstractAuditingEntity {

    @Id
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne
    @JoinColumn(name = "research_group_id")
    private ResearchGroup researchGroup;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "avatar")
    private String avatar;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
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

    @Column(name = "university_id", length = 7, unique = true)
    private String universityId;

    // Contains all the Jobs that a User (Professor) has posted
    @OneToMany(mappedBy = "supervisingProfessor", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Job> postedJobs = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserResearchGroupRole> researchGroupRoles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmailSetting> emailSettings = new HashSet<>();

    /**
     * Ensure defaults before persisting a new user.
     */
    @PrePersist
    public void prePersist() {
        if (this.selectedLanguage == null) {
            this.selectedLanguage = "en";
        }
    }
}
