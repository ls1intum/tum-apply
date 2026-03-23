package de.tum.cit.aet.interview.domain;

import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.time.Instant;
import java.util.UUID;

@StaticMetamodel(InterviewSlot.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class InterviewSlot_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String GRAPH_INTERVIEW_SLOT_WITH_INTERVIEWEE_DETAILS = "InterviewSlot.withIntervieweeDetails";
    public static final String START_DATE_TIME = "startDateTime";
    public static final String GRAPH_INTERVIEW_SLOT_WITH_PROCESS_JOB_DETAILS = "InterviewSlot.withProcessJobDetails";
    public static final String LOCATION = "location";
    public static final String IS_BOOKED = "isBooked";
    public static final String ID = "id";
    public static final String END_DATE_TIME = "endDateTime";
    public static final String INTERVIEW_PROCESS = "interviewProcess";
    public static final String VERSION = "version";
    public static final String INTERVIEWEE = "interviewee";
    public static final String STREAM_LINK = "streamLink";

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#startDateTime
     **/
    public static volatile SingularAttribute<InterviewSlot, Instant> startDateTime;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#location
     **/
    public static volatile SingularAttribute<InterviewSlot, String> location;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#isBooked
     **/
    public static volatile SingularAttribute<InterviewSlot, Boolean> isBooked;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#id
     **/
    public static volatile SingularAttribute<InterviewSlot, UUID> id;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#endDateTime
     **/
    public static volatile SingularAttribute<InterviewSlot, Instant> endDateTime;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot
     **/
    public static volatile EntityType<InterviewSlot> class_;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#interviewProcess
     **/
    public static volatile SingularAttribute<InterviewSlot, InterviewProcess> interviewProcess;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#version
     **/
    public static volatile SingularAttribute<InterviewSlot, Long> version;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#interviewee
     **/
    public static volatile SingularAttribute<InterviewSlot, Interviewee> interviewee;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewSlot#streamLink
     **/
    public static volatile SingularAttribute<InterviewSlot, String> streamLink;
}
