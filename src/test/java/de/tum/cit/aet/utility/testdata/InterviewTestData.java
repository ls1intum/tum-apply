package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.domain.Job;

/**
 * Test data helpers for Interview domain entities.
 */
public final class InterviewTestData {

    private InterviewTestData() {}

    /** Creates an unsaved InterviewProcess for the given job. */
    public static InterviewProcess newProcess(Job job) {
        InterviewProcess p = new InterviewProcess();
        p.setJob(job);
        return p;
    }

    /** Creates an unsaved Interviewee linked to an application and process. */
    public static Interviewee newInterviewee(Application application, InterviewProcess process) {
        Interviewee i = new Interviewee();
        i.setApplication(application);
        i.setInterviewProcess(process);
        return i;
    }

    // --- Saved variants
    // -------------------------------------------------------------------------

    public static InterviewProcess savedProcess(InterviewProcessRepository repo, Job job) {
        return repo.save(newProcess(job));
    }

    public static Interviewee savedInterviewee(IntervieweeRepository repo, Application application, InterviewProcess process) {
        return repo.save(newInterviewee(application, process));
    }
}
