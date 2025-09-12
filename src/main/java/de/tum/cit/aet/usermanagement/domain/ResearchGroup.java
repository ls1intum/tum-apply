package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A ResearchGroup.
 */
@Getter
@Setter
@Entity
@Table(name = "research_groups")
public class ResearchGroup extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "research_group_id", nullable = false)
    private UUID researchGroupId;

    @Column(name = "head")
    private String head;

    @Column(name = "name")
    private String name;

    @Column(name = "abbreviation")
    private String abbreviation;

    @Column(name = "email")
    private String email;

    @Column(name = "website")
    private String website;

    @Column(name = "school")
    private String school;

    @Column(name = "description")
    private String description;

    @Column(name = "default_field_of_studies")
    private String defaultFieldOfStudies;

    @Column(name = "street")
    private String street;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "city")
    private String city;

    @Column(name = "university_id")
    private String universityId;

    @OneToMany(mappedBy = "researchGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserResearchGroupRole> userRoles = new HashSet<>();
}
