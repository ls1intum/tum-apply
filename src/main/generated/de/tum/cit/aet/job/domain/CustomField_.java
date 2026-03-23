package de.tum.cit.aet.job.domain;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.job.constants.CustomFieldType;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.List;
import java.util.UUID;

@StaticMetamodel(CustomField.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class CustomField_ {

    public static final String IS_REQUIRED = "isRequired";
    public static final String SEQUENCE = "sequence";
    public static final String QUESTION = "question";
    public static final String CUSTOM_FIELD_ANSWERS = "customFieldAnswers";
    public static final String CUSTOM_FIELD_ID = "customFieldId";
    public static final String JOB = "job";
    public static final String CUSTOM_FIELD_TYPE = "customFieldType";
    public static final String ANSWER_OPTIONS = "answerOptions";

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#isRequired
     **/
    public static volatile SingularAttribute<CustomField, Boolean> isRequired;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#sequence
     **/
    public static volatile SingularAttribute<CustomField, Integer> sequence;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#question
     **/
    public static volatile SingularAttribute<CustomField, String> question;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#customFieldAnswers
     **/
    public static volatile SetAttribute<CustomField, CustomFieldAnswer> customFieldAnswers;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#customFieldId
     **/
    public static volatile SingularAttribute<CustomField, UUID> customFieldId;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#job
     **/
    public static volatile SingularAttribute<CustomField, Job> job;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField
     **/
    public static volatile EntityType<CustomField> class_;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#customFieldType
     **/
    public static volatile SingularAttribute<CustomField, CustomFieldType> customFieldType;

    /**
     * @see de.tum.cit.aet.job.domain.CustomField#answerOptions
     **/
    public static volatile SingularAttribute<CustomField, List<String>> answerOptions;
}
