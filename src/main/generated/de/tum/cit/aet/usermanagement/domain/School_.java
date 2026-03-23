package de.tum.cit.aet.usermanagement.domain;

import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(School.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class School_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String SCHOOL_ID = "schoolId";
    public static final String NAME = "name";
    public static final String ABBREVIATION = "abbreviation";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.School#schoolId
     **/
    public static volatile SingularAttribute<School, UUID> schoolId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.School#name
     **/
    public static volatile SingularAttribute<School, String> name;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.School#abbreviation
     **/
    public static volatile SingularAttribute<School, String> abbreviation;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.School
     **/
    public static volatile EntityType<School> class_;
}
