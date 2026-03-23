package de.tum.cit.aet.interview.domain;

import de.tum.cit.aet.job.domain.Job;
import jakarta.annotation.Generated;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import jakarta.persistence.metamodel.StaticMetamodel;
import java.util.UUID;

@StaticMetamodel(InterviewProcess.class)
@Generated("org.hibernate.processor.HibernateProcessor")
public abstract class InterviewProcess_ extends de.tum.cit.aet.core.domain.AbstractAuditingEntity_ {

    public static final String ID = "id";
    public static final String JOB = "job";

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewProcess#id
     **/
    public static volatile SingularAttribute<InterviewProcess, UUID> id;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewProcess#job
     **/
    public static volatile SingularAttribute<InterviewProcess, Job> job;

    /**
     * @see de.tum.cit.aet.interview.domain.InterviewProcess
     **/
    public static volatile EntityType<InterviewProcess> class_;
}
