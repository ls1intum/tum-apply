package de.tum.cit.aet.core.domain;

import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.MappedSuperclassType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.LocalDateTime;

@StaticMetamodel(AbstractAuditingEntity.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class AbstractAuditingEntity_ {

    public static final String CREATED_AT = "createdAt";
    public static final String LAST_MODIFIED_AT = "lastModifiedAt";

    /**
     * @see de.tum.cit.aet.core.domain.AbstractAuditingEntity#createdAt
     **/
    public static volatile SingularAttribute<AbstractAuditingEntity, LocalDateTime> createdAt;

    /**
     * @see de.tum.cit.aet.core.domain.AbstractAuditingEntity#lastModifiedAt
     **/
    public static volatile SingularAttribute<AbstractAuditingEntity, LocalDateTime> lastModifiedAt;

    /**
     * @see de.tum.cit.aet.core.domain.AbstractAuditingEntity
     **/
    public static volatile MappedSuperclassType<AbstractAuditingEntity> class_;
}
