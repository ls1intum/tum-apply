package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.usermanagement.domain.key.UserSettingId;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.sql.Timestamp;

@StaticMetamodel(UserSetting.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class UserSetting_ {

    public static final String ID = "id";
    public static final String USER = "user";
    public static final String VALUE = "value";
    public static final String UPDATED_AT = "updatedAt";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserSetting#id
     **/
    public static volatile SingularAttribute<UserSetting, UserSettingId> id;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserSetting
     **/
    public static volatile EntityType<UserSetting> class_;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserSetting#user
     **/
    public static volatile SingularAttribute<UserSetting, User> user;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserSetting#value
     **/
    public static volatile SingularAttribute<UserSetting, String> value;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.UserSetting#updatedAt
     **/
    public static volatile SingularAttribute<UserSetting, Timestamp> updatedAt;
}
