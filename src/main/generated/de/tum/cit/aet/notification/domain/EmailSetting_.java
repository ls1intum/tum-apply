package de.tum.cit.aet.notification.domain;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(EmailSetting.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class EmailSetting_ {

    public static final String EMAIL_TYPE = "emailType";
    public static final String EMAIL_SETTING_ID = "emailSettingId";
    public static final String USER = "user";
    public static final String ENABLED = "enabled";

    /**
     * @see de.tum.cit.aet.notification.domain.EmailSetting#emailType
     **/
    public static volatile SingularAttribute<EmailSetting, EmailType> emailType;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailSetting#emailSettingId
     **/
    public static volatile SingularAttribute<EmailSetting, UUID> emailSettingId;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailSetting
     **/
    public static volatile EntityType<EmailSetting> class_;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailSetting#user
     **/
    public static volatile SingularAttribute<EmailSetting, User> user;

    /**
     * @see de.tum.cit.aet.notification.domain.EmailSetting#enabled
     **/
    public static volatile SingularAttribute<EmailSetting, Boolean> enabled;
}
