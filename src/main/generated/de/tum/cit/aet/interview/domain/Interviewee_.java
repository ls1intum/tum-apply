package de.tum.cit.aet.interview.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.ListAttribute;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.Instant;
import java.util.UUID;

@StaticMetamodel(Interviewee.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class Interviewee_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String SLOTS = "slots";
    public static final String APPLICATION = "application";
    public static final String LAST_INVITED = "lastInvited";
    public static final String ASSESSMENT_NOTES = "assessmentNotes";
    public static final String RATING = "rating";
    public static final String ID = "id";
    public static final String INTERVIEW_PROCESS = "interviewProcess";
    public static final String VERSION = "version";

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#slots
     **/
    public static volatile ListAttribute<Interviewee, InterviewSlot> slots;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#application
     **/
    public static volatile SingularAttribute<Interviewee, Application> application;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#lastInvited
     **/
    public static volatile SingularAttribute<Interviewee, Instant> lastInvited;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#assessmentNotes
     **/
    public static volatile SingularAttribute<Interviewee, String> assessmentNotes;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#rating
     **/
    public static volatile SingularAttribute<Interviewee, AssessmentRating> rating;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#id
     **/
    public static volatile SingularAttribute<Interviewee, UUID> id;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee
     **/
    public static volatile EntityType<Interviewee> class_;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#interviewProcess
     **/
    public static volatile SingularAttribute<Interviewee, InterviewProcess> interviewProcess;

    /**
     * @see de.tum.cit.aet.interview.domain.Interviewee#version
     **/
    public static volatile SingularAttribute<Interviewee, Long> version;
}
