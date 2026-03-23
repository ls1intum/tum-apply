package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(Applicant.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Applicant_ {

    public static final String MASTER_GRADE = "masterGrade";
    public static final String COUNTRY = "country";
    public static final String BACHELOR_GRADE_UPPER_LIMIT = "bachelorGradeUpperLimit";
    public static final String CITY = "city";
    public static final String MASTER_DEGREE_NAME = "masterDegreeName";
    public static final String MASTER_GRADE_UPPER_LIMIT = "masterGradeUpperLimit";
    public static final String POSTAL_CODE = "postalCode";
    public static final String USER_ID = "userId";
    public static final String BACHELOR_DEGREE_NAME = "bachelorDegreeName";
    public static final String SUBMITTED_APPLICATIONS = "submittedApplications";
    public static final String STREET = "street";
    public static final String BACHELOR_GRADE_LOWER_LIMIT = "bachelorGradeLowerLimit";
    public static final String MASTER_UNIVERSITY = "masterUniversity";
    public static final String MASTER_GRADE_LOWER_LIMIT = "masterGradeLowerLimit";
    public static final String DOCUMENT_DICTIONARIES = "documentDictionaries";
    public static final String USER = "user";
    public static final String BACHELOR_GRADE = "bachelorGrade";
    public static final String BACHELOR_UNIVERSITY = "bachelorUniversity";

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#masterGrade
     **/
    public static volatile SingularAttribute<Applicant, String> masterGrade;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#country
     **/
    public static volatile SingularAttribute<Applicant, String> country;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#bachelorGradeUpperLimit
     **/
    public static volatile SingularAttribute<Applicant, String> bachelorGradeUpperLimit;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#city
     **/
    public static volatile SingularAttribute<Applicant, String> city;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#masterDegreeName
     **/
    public static volatile SingularAttribute<Applicant, String> masterDegreeName;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#masterGradeUpperLimit
     **/
    public static volatile SingularAttribute<Applicant, String> masterGradeUpperLimit;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#postalCode
     **/
    public static volatile SingularAttribute<Applicant, String> postalCode;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#userId
     **/
    public static volatile SingularAttribute<Applicant, UUID> userId;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#bachelorDegreeName
     **/
    public static volatile SingularAttribute<Applicant, String> bachelorDegreeName;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#submittedApplications
     **/
    public static volatile SetAttribute<Applicant, Application> submittedApplications;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#street
     **/
    public static volatile SingularAttribute<Applicant, String> street;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#bachelorGradeLowerLimit
     **/
    public static volatile SingularAttribute<Applicant, String> bachelorGradeLowerLimit;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#masterUniversity
     **/
    public static volatile SingularAttribute<Applicant, String> masterUniversity;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#masterGradeLowerLimit
     **/
    public static volatile SingularAttribute<Applicant, String> masterGradeLowerLimit;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#documentDictionaries
     **/
    public static volatile SetAttribute<Applicant, DocumentDictionary> documentDictionaries;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant
     **/
    public static volatile EntityType<Applicant> class_;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#user
     **/
    public static volatile SingularAttribute<Applicant, User> user;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#bachelorGrade
     **/
    public static volatile SingularAttribute<Applicant, String> bachelorGrade;

    /**
     * @see de.tum.cit.aet.usermanagement.domain.Applicant#bachelorUniversity
     **/
    public static volatile SingularAttribute<Applicant, String> bachelorUniversity;
}
