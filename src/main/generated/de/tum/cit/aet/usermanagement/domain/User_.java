package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.domain.EmailSetting;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@StaticMetamodel(User.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class User_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String BIRTHDAY = "birthday";
    public static final String LAST_NAME = "lastName";
    public static final String WEBSITE = "website";
    public static final String SELECTED_LANGUAGE = "selectedLanguage";
    public static final String RESEARCH_GROUP_ROLES = "researchGroupRoles";
    public static final String GENDER = "gender";
    public static final String LINKEDIN_URL = "linkedinUrl";
    public static final String EMAIL_SETTINGS = "emailSettings";
    public static final String LAST_ACTIVITY_AT = "lastActivityAt";
    public static final String AVATAR = "avatar";
    public static final String USER_ID = "userId";
    public static final String POSTED_JOBS = "postedJobs";
    public static final String FIRST_NAME = "firstName";
    public static final String UNIVERSITY_ID = "universityId";
    public static final String PHONE_NUMBER = "phoneNumber";
    public static final String NATIONALITY = "nationality";
    public static final String RESEARCH_GROUP = "researchGroup";
    public static final String EMAIL = "email";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#birthday
     **/
    public static volatile SingularAttribute<User, LocalDate> birthday;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#lastName
     **/
    public static volatile SingularAttribute<User, String> lastName;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#website
     **/
    public static volatile SingularAttribute<User, String> website;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#selectedLanguage
     **/
    public static volatile SingularAttribute<User, String> selectedLanguage;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#researchGroupRoles
     **/
    public static volatile SetAttribute<User, UserResearchGroupRole> researchGroupRoles;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#gender
     **/
    public static volatile SingularAttribute<User, String> gender;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#linkedinUrl
     **/
    public static volatile SingularAttribute<User, String> linkedinUrl;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#emailSettings
     **/
    public static volatile SetAttribute<User, EmailSetting> emailSettings;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#lastActivityAt
     **/
    public static volatile SingularAttribute<User, LocalDateTime> lastActivityAt;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#avatar
     **/
    public static volatile SingularAttribute<User, String> avatar;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#userId
     **/
    public static volatile SingularAttribute<User, UUID> userId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#postedJobs
     **/
    public static volatile SetAttribute<User, Job> postedJobs;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#firstName
     **/
    public static volatile SingularAttribute<User, String> firstName;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#universityId
     **/
    public static volatile SingularAttribute<User, String> universityId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#phoneNumber
     **/
    public static volatile SingularAttribute<User, String> phoneNumber;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#nationality
     **/
    public static volatile SingularAttribute<User, String> nationality;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#researchGroup
     **/
    public static volatile SingularAttribute<User, ResearchGroup> researchGroup;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User
     **/
    public static volatile EntityType<User> class_;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.User#email
     **/
    public static volatile SingularAttribute<User, String> email;
}
