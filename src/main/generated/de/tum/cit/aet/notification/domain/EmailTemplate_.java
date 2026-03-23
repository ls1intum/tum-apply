package de.tum.cit.aet.notification.domain;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(EmailTemplate.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class EmailTemplate_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String IS_DEFAULT = "isDefault";
    public static final String TEMPLATE_NAME = "templateName";
    public static final String EMAIL_TYPE = "emailType";
    public static final String CREATED_BY = "createdBy";
    public static final String TRANSLATIONS = "translations";
    public static final String EMAIL_TEMPLATE_ID = "emailTemplateId";
    public static final String RESEARCH_GROUP = "researchGroup";

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate#isDefault
     **/
    public static volatile SingularAttribute<EmailTemplate, Boolean> isDefault;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate#templateName
     **/
    public static volatile SingularAttribute<EmailTemplate, String> templateName;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate#emailType
     **/
    public static volatile SingularAttribute<EmailTemplate, EmailType> emailType;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate#createdBy
     **/
    public static volatile SingularAttribute<EmailTemplate, User> createdBy;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate#translations
     **/
    public static volatile SetAttribute<EmailTemplate, EmailTemplateTranslation> translations;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate#emailTemplateId
     **/
    public static volatile SingularAttribute<EmailTemplate, UUID> emailTemplateId;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate#researchGroup
     **/
    public static volatile SingularAttribute<EmailTemplate, ResearchGroup> researchGroup;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplate
     **/
    public static volatile EntityType<EmailTemplate> class_;
}
