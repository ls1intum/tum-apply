package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import jakarta.persistence.*;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

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
    @Column(name = "research_group_id", nullable = false)
    private UUID researchGroupId;

    @OneToMany(mappedBy = "researchGroup")
    private Set<User> employeesAt;

    @Column(name = "description")
    private String description;

    @Column(name = "default_field_of_studies")
    private String defaultFieldOfStudies;

    @Column(name = "street")
    private String street;

    @Column(name = "postalCode")
    private String postalCode;

    @Column(name = "city")
    private String city;
}
