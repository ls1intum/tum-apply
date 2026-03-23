package de.tum.cit.aet.evaluation.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(Rating.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Rating_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String APPLICATION = "application";
    public static final String RATING_ID = "ratingId";
    public static final String RATING = "rating";
    public static final String FROM = "from";

    /**
     * @see de.tum.cit.aet.evaluation.domain.Rating#application
     **/
    public static volatile SingularAttribute<Rating, Application> application;

    /**
     * @see de.tum.cit.aet.evaluation.domain.Rating#ratingId
     **/
    public static volatile SingularAttribute<Rating, UUID> ratingId;

    /**
     * @see de.tum.cit.aet.evaluation.domain.Rating#rating
     **/
    public static volatile SingularAttribute<Rating, Integer> rating;

    /**
     * @see de.tum.cit.aet.evaluation.domain.Rating#from
     **/
    public static volatile SingularAttribute<Rating, User> from;

    /**
     * @see de.tum.cit.aet.evaluation.domain.Rating
     **/
    public static volatile EntityType<Rating> class_;
}
