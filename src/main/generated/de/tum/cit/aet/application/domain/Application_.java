package de.tum.cit.aet.application.domain;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@StaticMetamodel(Application.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Application_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String APPLICANT_COUNTRY = "applicantCountry";
    public static final String INTERNAL_COMMENTS = "internalComments";
    public static final String PROJECTS = "projects";
    public static final String APPLICANT_BACHELOR_GRADE_LOWER_LIMIT = "applicantBachelorGradeLowerLimit";
    public static final String APPLICANT_STREET = "applicantStreet";
    public static final String DESIRED_START_DATE = "desiredStartDate";
    public static final String MOTIVATION = "motivation";
    public static final String APPLICANT_BACHELOR_GRADE = "applicantBachelorGrade";
    public static final String APPLICANT_CITY = "applicantCity";
    public static final String APPLICANT_MASTER_GRADE_UPPER_LIMIT = "applicantMasterGradeUpperLimit";
    public static final String APPLICANT_MASTER_GRADE = "applicantMasterGrade";
    public static final String APPLICANT_NATIONALITY = "applicantNationality";
    public static final String APPLICANT_BACHELOR_DEGREE_NAME = "applicantBachelorDegreeName";
    public static final String APPLICANT_MASTER_DEGREE_NAME = "applicantMasterDegreeName";
    public static final String STATE = "state";
    public static final String APPLICANT_MASTER_UNIVERSITY = "applicantMasterUniversity";
    public static final String APPLICANT_MASTER_GRADE_LOWER_LIMIT = "applicantMasterGradeLowerLimit";
    public static final String APPLICANT_PHONE_NUMBER = "applicantPhoneNumber";
    public static final String APPLICANT_BIRTHDAY = "applicantBirthday";
    public static final String APPLICANT_LAST_NAME = "applicantLastName";
    public static final String APPLICANT_BACHELOR_UNIVERSITY = "applicantBachelorUniversity";
    public static final String SPECIAL_SKILLS = "specialSkills";
    public static final String APPLICANT_FIRST_NAME = "applicantFirstName";
    public static final String APPLICANT_EMAIL = "applicantEmail";
    public static final String APPLICANT = "applicant";
    public static final String APPLICANT_WEBSITE = "applicantWebsite";
    public static final String APPLICANT_GENDER = "applicantGender";
    public static final String APPLICANT_LINKEDIN_URL = "applicantLinkedinUrl";
    public static final String CUSTOM_FIELD_ANSWERS = "customFieldAnswers";
    public static final String APPLICANT_BACHELOR_GRADE_UPPER_LIMIT = "applicantBachelorGradeUpperLimit";
    public static final String APPLICANT_POSTAL_CODE = "applicantPostalCode";
    public static final String APPLICATION_REVIEW = "applicationReview";
    public static final String APPLICATION_ID = "applicationId";
    public static final String JOB = "job";
    public static final String DOCUMENT_DICTIONARIES = "documentDictionaries";
    public static final String APPLIED_AT = "appliedAt";

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantCountry
     **/
    public static volatile SingularAttribute<Application, String> applicantCountry;

    /**
     * @see de.tum.cit.aet.application.domain.Application#internalComments
     **/
    public static volatile SetAttribute<Application, InternalComment> internalComments;

    /**
     * @see de.tum.cit.aet.application.domain.Application#projects
     **/
    public static volatile SingularAttribute<Application, String> projects;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantBachelorGradeLowerLimit
     **/
    public static volatile SingularAttribute<Application, String> applicantBachelorGradeLowerLimit;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantStreet
     **/
    public static volatile SingularAttribute<Application, String> applicantStreet;

    /**
     * @see de.tum.cit.aet.application.domain.Application#desiredStartDate
     **/
    public static volatile SingularAttribute<Application, LocalDate> desiredStartDate;

    /**
     * @see de.tum.cit.aet.application.domain.Application#motivation
     **/
    public static volatile SingularAttribute<Application, String> motivation;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantBachelorGrade
     **/
    public static volatile SingularAttribute<Application, String> applicantBachelorGrade;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantCity
     **/
    public static volatile SingularAttribute<Application, String> applicantCity;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantMasterGradeUpperLimit
     **/
    public static volatile SingularAttribute<Application, String> applicantMasterGradeUpperLimit;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantMasterGrade
     **/
    public static volatile SingularAttribute<Application, String> applicantMasterGrade;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantNationality
     **/
    public static volatile SingularAttribute<Application, String> applicantNationality;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantBachelorDegreeName
     **/
    public static volatile SingularAttribute<Application, String> applicantBachelorDegreeName;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantMasterDegreeName
     **/
    public static volatile SingularAttribute<Application, String> applicantMasterDegreeName;

    /**
     * @see de.tum.cit.aet.application.domain.Application#state
     **/
    public static volatile SingularAttribute<Application, ApplicationState> state;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantMasterUniversity
     **/
    public static volatile SingularAttribute<Application, String> applicantMasterUniversity;

    /**
     * @see de.tum.cit.aet.application.domain.Application
     **/
    public static volatile EntityType<Application> class_;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantMasterGradeLowerLimit
     **/
    public static volatile SingularAttribute<Application, String> applicantMasterGradeLowerLimit;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantPhoneNumber
     **/
    public static volatile SingularAttribute<Application, String> applicantPhoneNumber;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantBirthday
     **/
    public static volatile SingularAttribute<Application, LocalDate> applicantBirthday;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantLastName
     **/
    public static volatile SingularAttribute<Application, String> applicantLastName;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantBachelorUniversity
     **/
    public static volatile SingularAttribute<Application, String> applicantBachelorUniversity;

    /**
     * @see de.tum.cit.aet.application.domain.Application#specialSkills
     **/
    public static volatile SingularAttribute<Application, String> specialSkills;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantFirstName
     **/
    public static volatile SingularAttribute<Application, String> applicantFirstName;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantEmail
     **/
    public static volatile SingularAttribute<Application, String> applicantEmail;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicant
     **/
    public static volatile SingularAttribute<Application, Applicant> applicant;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantWebsite
     **/
    public static volatile SingularAttribute<Application, String> applicantWebsite;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantGender
     **/
    public static volatile SingularAttribute<Application, String> applicantGender;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantLinkedinUrl
     **/
    public static volatile SingularAttribute<Application, String> applicantLinkedinUrl;

    /**
     * @see de.tum.cit.aet.application.domain.Application#customFieldAnswers
     **/
    public static volatile SetAttribute<Application, CustomFieldAnswer> customFieldAnswers;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantBachelorGradeUpperLimit
     **/
    public static volatile SingularAttribute<Application, String> applicantBachelorGradeUpperLimit;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicantPostalCode
     **/
    public static volatile SingularAttribute<Application, String> applicantPostalCode;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicationReview
     **/
    public static volatile SingularAttribute<Application, ApplicationReview> applicationReview;

    /**
     * @see de.tum.cit.aet.application.domain.Application#applicationId
     **/
    public static volatile SingularAttribute<Application, UUID> applicationId;

    /**
     * @see de.tum.cit.aet.application.domain.Application#job
     **/
    public static volatile SingularAttribute<Application, Job> job;

    /**
     * @see de.tum.cit.aet.application.domain.Application#documentDictionaries
     **/
    public static volatile SetAttribute<Application, DocumentDictionary> documentDictionaries;

    /**
     * @see de.tum.cit.aet.application.domain.Application#appliedAt
     **/
    public static volatile SingularAttribute<Application, LocalDateTime> appliedAt;
}
