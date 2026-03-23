package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(ResearchGroup.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class ResearchGroup_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String WEBSITE = "website";
    public static final String CITY = "city";
    public static final String POSTAL_CODE = "postalCode";
    public static final String DESCRIPTION = "description";
    public static final String ABBREVIATION = "abbreviation";
    public static final String HEAD = "head";
    public static final String UNIVERSITY_ID = "universityId";
    public static final String USER_ROLES = "userRoles";
    public static final String RESEARCH_GROUP_ID = "researchGroupId";
    public static final String STREET = "street";
    public static final String NAME = "name";
    public static final String STATE = "state";
    public static final String DEPARTMENT = "department";
    public static final String EMAIL = "email";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#website
     **/
    public static volatile SingularAttribute<ResearchGroup, String> website;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#city
     **/
    public static volatile SingularAttribute<ResearchGroup, String> city;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#postalCode
     **/
    public static volatile SingularAttribute<ResearchGroup, String> postalCode;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#description
     **/
    public static volatile SingularAttribute<ResearchGroup, String> description;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#abbreviation
     **/
    public static volatile SingularAttribute<ResearchGroup, String> abbreviation;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#head
     **/
    public static volatile SingularAttribute<ResearchGroup, String> head;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#universityId
     **/
    public static volatile SingularAttribute<ResearchGroup, String> universityId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#userRoles
     **/
    public static volatile SetAttribute<ResearchGroup, UserResearchGroupRole> userRoles;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#researchGroupId
     **/
    public static volatile SingularAttribute<ResearchGroup, UUID> researchGroupId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#street
     **/
    public static volatile SingularAttribute<ResearchGroup, String> street;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#name
     **/
    public static volatile SingularAttribute<ResearchGroup, String> name;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#state
     **/
    public static volatile SingularAttribute<ResearchGroup, ResearchGroupState> state;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#department
     **/
    public static volatile SingularAttribute<ResearchGroup, Department> department;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup
     **/
    public static volatile EntityType<ResearchGroup> class_;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.ResearchGroup#email
     **/
    public static volatile SingularAttribute<ResearchGroup, String> email;
}
