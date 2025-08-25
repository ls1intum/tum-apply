package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;

import java.time.LocalDate;

/**
 * Test data helpers for Application.
 */
public final class ApplicationTestData {
    private ApplicationTestData() {}

    /** Creates an unsaved Application with sensible defaults. */
    public static Application newApplication(
        Job job,
        Applicant applicant,
        ApplicationState state
    ) {
        Application app = new Application();
        app.setJob(job);
        app.setApplicant(applicant);
        app.setState(state != null ? state : ApplicationState.SENT);
        app.setDesiredStartDate(LocalDate.now().plusMonths(1));
        app.setProjects("Robotics Project; ML Pipeline");
        app.setSpecialSkills("Python, TensorFlow, ROS");
        app.setMotivation("Highly motivated to contribute to research.");
        // applicationReview, customFieldAnswers, internalComments left null/empty
        return app;
    }

    /** Unsaved Application with override options (null = keep default). */
    public static Application newApplicationAll(
        Job job,
        Applicant applicant,
        ApplicationState state,
        LocalDate desiredStartDate,
        String projects,
        String specialSkills,
        String motivation
    ) {
        Application app = newApplication(job, applicant, state);
        if (desiredStartDate != null) app.setDesiredStartDate(desiredStartDate);
        if (projects != null) app.setProjects(projects);
        if (specialSkills != null) app.setSpecialSkills(specialSkills);
        if (motivation != null) app.setMotivation(motivation);
        return app;
    }

    // --- Convenience creators for common states (unsaved) ---------------------------------------
    public static Application sent(Job job, Applicant applicant) {
        return newApplication(job, applicant, ApplicationState.SENT);
    }
    public static Application inReview(Job job, Applicant applicant) {
        return newApplication(job, applicant, ApplicationState.IN_REVIEW);
    }
    public static Application accepted(Job job, Applicant applicant) {
        return newApplication(job, applicant, ApplicationState.ACCEPTED);
    }
    public static Application rejected(Job job, Applicant applicant) {
        return newApplication(job, applicant, ApplicationState.REJECTED);
    }

    // --- Saved variants -------------------------------------------------------------------------
    public static Application saved(ApplicationRepository repo, Job job, Applicant applicant, ApplicationState state) {
        return repo.save(newApplication(job, applicant, state));
    }
    public static Application savedSent(ApplicationRepository repo, Job job, Applicant applicant) {
        return repo.save(sent(job, applicant));
    }
    public static Application savedInReview(ApplicationRepository repo, Job job, Applicant applicant) {
        return repo.save(inReview(job, applicant));
    }
    public static Application savedAccepted(ApplicationRepository repo, Job job, Applicant applicant) {
        return repo.save(accepted(job, applicant));
    }
    public static Application savedRejected(ApplicationRepository repo, Job job, Applicant applicant) {
        return repo.save(rejected(job, applicant));
    }

    public static Application savedAll(
        ApplicationRepository repo,
        Job job,
        Applicant applicant,
        ApplicationState state,
        LocalDate desiredStartDate,
        String projects,
        String specialSkills,
        String motivation
    ) {
        return repo.save(newApplicationAll(job, applicant, state, desiredStartDate, projects, specialSkills, motivation));
    }
}
