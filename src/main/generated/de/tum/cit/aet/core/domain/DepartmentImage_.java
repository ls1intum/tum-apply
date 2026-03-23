package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.usermanagement.domain.Department;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(DepartmentImage.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class DepartmentImage_ extends de.tum.cit.aet.core.domain.Image_ {

    public static final String DEPARTMENT = "department";

    /**
     * @see de.tum.cit.aet.core.domain.DepartmentImage#department
     **/
    public static volatile SingularAttribute<DepartmentImage, Department> department;

    /**
     * @see de.tum.cit.aet.core.domain.DepartmentImage
     **/
    public static volatile EntityType<DepartmentImage> class_;
}
