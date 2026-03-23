package de.tum.cit.aet.usermanagement.domain;

import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(Department.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Department_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String SCHOOL = "school";
    public static final String DEPARTMENT_ID = "departmentId";
    public static final String NAME = "name";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Department#school
     **/
    public static volatile SingularAttribute<Department, School> school;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Department#departmentId
     **/
    public static volatile SingularAttribute<Department, UUID> departmentId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Department#name
     **/
    public static volatile SingularAttribute<Department, String> name;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Department
     **/
    public static volatile EntityType<Department> class_;
}
