package de.tum.cit.aet.evaluation.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.LocalDateTime;
import java.util.UUID;

@StaticMetamodel(ApplicationReview.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class ApplicationReview_ {

    public static final String REASON = "reason";
    public static final String APPLICATION = "application";
    public static final String REVIEWED_AT = "reviewedAt";
    public static final String APPLICATION_REVIEW_ID = "applicationReviewId";
    public static final String REVIEWED_BY = "reviewedBy";

    /**
     * @see de.tum.cit.aet.evaluation.domain.ApplicationReview#reason
     **/
    public static volatile SingularAttribute<ApplicationReview, String> reason;

    /**
     * @see de.tum.cit.aet.evaluation.domain.ApplicationReview#application
     **/
    public static volatile SingularAttribute<ApplicationReview, Application> application;

    /**
     * @see de.tum.cit.aet.evaluation.domain.ApplicationReview#reviewedAt
     **/
    public static volatile SingularAttribute<ApplicationReview, LocalDateTime> reviewedAt;

    /**
     * @see de.tum.cit.aet.evaluation.domain.ApplicationReview#applicationReviewId
     **/
    public static volatile SingularAttribute<ApplicationReview, UUID> applicationReviewId;

    /**
     * @see de.tum.cit.aet.evaluation.domain.ApplicationReview#reviewedBy
     **/
    public static volatile SingularAttribute<ApplicationReview, User> reviewedBy;

    /**
     * @see de.tum.cit.aet.evaluation.domain.ApplicationReview
     **/
    public static volatile EntityType<ApplicationReview> class_;
}
