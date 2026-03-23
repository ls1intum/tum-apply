package de.tum.cit.aet.application.domain;

import de.tum.cit.aet.job.domain.CustomField;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.List;
import java.util.UUID;

@StaticMetamodel(CustomFieldAnswer.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class CustomFieldAnswer_ {

    public static final String APPLICATION = "application";
    public static final String ANSWERS = "answers";
    public static final String CUSTOM_FIELD_ANSWER_ID = "customFieldAnswerId";
    public static final String CUSTOM_FIELD = "customField";

    /**
     * @see de.tum.cit.aet.application.domain.CustomFieldAnswer#application
     **/
    public static volatile SingularAttribute<CustomFieldAnswer, Application> application;

    /**
     * @see de.tum.cit.aet.application.domain.CustomFieldAnswer#answers
     **/
    public static volatile SingularAttribute<CustomFieldAnswer, List<String>> answers;

    /**
     * @see de.tum.cit.aet.application.domain.CustomFieldAnswer
     **/
    public static volatile EntityType<CustomFieldAnswer> class_;

    /**
     * @see de.tum.cit.aet.application.domain.CustomFieldAnswer#customFieldAnswerId
     **/
    public static volatile SingularAttribute<CustomFieldAnswer, UUID> customFieldAnswerId;

    /**
     * @see de.tum.cit.aet.application.domain.CustomFieldAnswer#customField
     **/
    public static volatile SingularAttribute<CustomFieldAnswer, CustomField> customField;
}
