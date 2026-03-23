package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(UserResearchGroupRole.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class UserResearchGroupRole_ {

    public static final String ROLE = "role";
    public static final String USER_RESEARCH_GROUP_ROLE_ID = "userResearchGroupRoleId";
    public static final String RESEARCH_GROUP = "researchGroup";
    public static final String USER = "user";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole#role
     **/
    public static volatile SingularAttribute<UserResearchGroupRole, UserRole> role;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole#userResearchGroupRoleId
     **/
    public static volatile SingularAttribute<UserResearchGroupRole, UUID> userResearchGroupRoleId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole#researchGroup
     **/
    public static volatile SingularAttribute<UserResearchGroupRole, ResearchGroup> researchGroup;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole
     **/
    public static volatile EntityType<UserResearchGroupRole> class_;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole#user
     **/
    public static volatile SingularAttribute<UserResearchGroupRole, User> user;
}
