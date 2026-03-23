package de.tum.cit.aet.usermanagement.domain.key;

import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EmbeddableType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(UserSettingId.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class UserSettingId_ {

    public static final String SETTING_KEY = "settingKey";
    public static final String USER_ID = "userId";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.key.UserSettingId#settingKey
     **/
    public static volatile SingularAttribute<UserSettingId, String> settingKey;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.key.UserSettingId
     **/
    public static volatile EmbeddableType<UserSettingId> class_;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.key.UserSettingId#userId
     **/
    public static volatile SingularAttribute<UserSettingId, UUID> userId;
}
