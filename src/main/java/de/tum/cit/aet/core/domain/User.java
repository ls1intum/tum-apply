package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.UserGroup;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.util.List;
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
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne
    @JoinColumn(name = "research_group_id")
    private ResearchGroup researchGroup;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, optional = true)
    private Applicant applicant;

    // Contains all the Jobs that a User (Professor) has posted
    @OneToMany(mappedBy = "postedBy", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Job> postedJobs;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "user_group", nullable = false)
    private UserGroup userGroup;

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

    @Column(name = "website")
    private String website;
}
