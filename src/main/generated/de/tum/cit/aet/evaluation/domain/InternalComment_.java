package de.tum.cit.aet.evaluation.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(InternalComment.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class InternalComment_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String INTERNAL_COMMENT_ID = "internalCommentId";
    public static final String APPLICATION = "application";
    public static final String CREATED_BY = "createdBy";
    public static final String MESSAGE = "message";

    /**
     * @see de.tum.cit.aet.evaluation.domain.InternalComment#internalCommentId
     **/
    public static volatile SingularAttribute<InternalComment, UUID> internalCommentId;

    /**
     * @see de.tum.cit.aet.evaluation.domain.InternalComment#application
     **/
    public static volatile SingularAttribute<InternalComment, Application> application;

    /**
     * @see de.tum.cit.aet.evaluation.domain.InternalComment#createdBy
     **/
    public static volatile SingularAttribute<InternalComment, User> createdBy;

    /**
     * @see de.tum.cit.aet.evaluation.domain.InternalComment#message
     **/
    public static volatile SingularAttribute<InternalComment, String> message;

    /**
     * @see de.tum.cit.aet.evaluation.domain.InternalComment
     **/
    public static volatile EntityType<InternalComment> class_;
}
