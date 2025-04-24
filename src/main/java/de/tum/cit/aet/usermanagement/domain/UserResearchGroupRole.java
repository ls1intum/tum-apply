package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A connection between a user, a research group and a role.
 */
@Getter
@Setter
@Entity
@Table(name = "user_research_group_roles")
public class UserResearchGroupRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_research_group_role_id", nullable = false)
    private UUID userResearchGroupRoleId;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @MapsId("researchGroupId")
    @JoinColumn(name = "research_group_id")
    private ResearchGroup researchGroup;

    @MapsId("role")
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private UserRole role;
}
