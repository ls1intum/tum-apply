package de.tum.cit.aet.job.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.ListAttribute;
import jakarta.persistence.metamodel.SetAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.LocalDate;
import java.util.UUID;

@StaticMetamodel(Job.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Job_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String SUPERVISING_PROFESSOR = "supervisingProfessor";
    public static final String IMAGE = "image";
    public static final String SUITABLE_FOR_DISABLED = "suitableForDisabled";
    public static final String CONTRACT_DURATION = "contractDuration";
    public static final String END_DATE = "endDate";
    public static final String CUSTOM_FIELDS = "customFields";
    public static final String WORKLOAD = "workload";
    public static final String TITLE = "title";
    public static final String JOB_ID = "jobId";
    public static final String JOB_DESCRIPTION_DE = "jobDescriptionDE";
    public static final String FUNDING_TYPE = "fundingType";
    public static final String SUBJECT_AREA = "subjectArea";
    public static final String LOCATION = "location";
    public static final String JOB_DESCRIPTION_EN = "jobDescriptionEN";
    public static final String STATE = "state";
    public static final String RESEARCH_GROUP = "researchGroup";
    public static final String RESEARCH_AREA = "researchArea";
    public static final String START_DATE = "startDate";
    public static final String APPLICATIONS = "applications";

    /**
     * @see de.tum.cit.aet.job.domain.Job#supervisingProfessor
     **/
    public static volatile SingularAttribute<Job, User> supervisingProfessor;

    /**
     * @see de.tum.cit.aet.job.domain.Job#image
     **/
    public static volatile SingularAttribute<Job, Image> image;

    /**
     * @see de.tum.cit.aet.job.domain.Job#suitableForDisabled
     **/
    public static volatile SingularAttribute<Job, Boolean> suitableForDisabled;

    /**
     * @see de.tum.cit.aet.job.domain.Job#contractDuration
     **/
    public static volatile SingularAttribute<Job, Integer> contractDuration;

    /**
     * @see de.tum.cit.aet.job.domain.Job#endDate
     **/
    public static volatile SingularAttribute<Job, LocalDate> endDate;

    /**
     * @see de.tum.cit.aet.job.domain.Job#customFields
     **/
    public static volatile ListAttribute<Job, CustomField> customFields;

    /**
     * @see de.tum.cit.aet.job.domain.Job#workload
     **/
    public static volatile SingularAttribute<Job, Integer> workload;

    /**
     * @see de.tum.cit.aet.job.domain.Job#title
     **/
    public static volatile SingularAttribute<Job, String> title;

    /**
     * @see de.tum.cit.aet.job.domain.Job#jobId
     **/
    public static volatile SingularAttribute<Job, UUID> jobId;

    /**
     * @see de.tum.cit.aet.job.domain.Job#jobDescriptionDE
     **/
    public static volatile SingularAttribute<Job, String> jobDescriptionDE;

    /**
     * @see de.tum.cit.aet.job.domain.Job#fundingType
     **/
    public static volatile SingularAttribute<Job, FundingType> fundingType;

    /**
     * @see de.tum.cit.aet.job.domain.Job#subjectArea
     **/
    public static volatile SingularAttribute<Job, SubjectArea> subjectArea;

    /**
     * @see de.tum.cit.aet.job.domain.Job#location
     **/
    public static volatile SingularAttribute<Job, Campus> location;

    /**
     * @see de.tum.cit.aet.job.domain.Job#jobDescriptionEN
     **/
    public static volatile SingularAttribute<Job, String> jobDescriptionEN;

    /**
     * @see de.tum.cit.aet.job.domain.Job#state
     **/
    public static volatile SingularAttribute<Job, JobState> state;

    /**
     * @see de.tum.cit.aet.job.domain.Job#researchGroup
     **/
    public static volatile SingularAttribute<Job, ResearchGroup> researchGroup;

    /**
     * @see de.tum.cit.aet.job.domain.Job#researchArea
     **/
    public static volatile SingularAttribute<Job, String> researchArea;

    /**
     * @see de.tum.cit.aet.job.domain.Job
     **/
    public static volatile EntityType<Job> class_;

    /**
     * @see de.tum.cit.aet.job.domain.Job#startDate
     **/
    public static volatile SingularAttribute<Job, LocalDate> startDate;

    /**
     * @see de.tum.cit.aet.job.domain.Job#applications
     **/
    public static volatile SetAttribute<Job, Application> applications;
}
