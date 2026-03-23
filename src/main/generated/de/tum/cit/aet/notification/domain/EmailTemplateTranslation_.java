package de.tum.cit.aet.notification.domain;

import de.tum.cit.aet.core.constants.Language;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(EmailTemplateTranslation.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class EmailTemplateTranslation_ {

    public static final String TRANSLATION_ID = "translationId";
    public static final String SUBJECT = "subject";
    public static final String EMAIL_TEMPLATE = "emailTemplate";
    public static final String LANGUAGE = "language";
    public static final String BODY_HTML = "bodyHtml";

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplateTranslation#translationId
     **/
    public static volatile SingularAttribute<EmailTemplateTranslation, UUID> translationId;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplateTranslation#subject
     **/
    public static volatile SingularAttribute<EmailTemplateTranslation, String> subject;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplateTranslation#emailTemplate
     **/
    public static volatile SingularAttribute<EmailTemplateTranslation, EmailTemplate> emailTemplate;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplateTranslation#language
     **/
    public static volatile SingularAttribute<EmailTemplateTranslation, Language> language;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplateTranslation#bodyHtml
     **/
    public static volatile SingularAttribute<EmailTemplateTranslation, String> bodyHtml;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailTemplateTranslation
     **/
    public static volatile EntityType<EmailTemplateTranslation> class_;
}
