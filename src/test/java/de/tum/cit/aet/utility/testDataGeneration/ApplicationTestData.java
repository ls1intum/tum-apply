package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.*;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Test data helpers for Application.
 */
public final class ApplicationTestData {

    private ApplicationTestData() {}

    /** Creates a new unsaved Application with default values. */
    public static Application newApplication(Applicant applicant, Job job) {
        Application app = new Application();
        app.setApplicationId(UUID.randomUUID());
        app.setApplicant(applicant);
        app.setJob(job);
        app.setState(ApplicationState.SAVED);
        app.setDesiredStartDate(LocalDate.now().plusWeeks(2));
        app.setProjects("Default Project");
        app.setSpecialSkills("Default Skills");
        app.setMotivation("Default Motivation");
        app.setCustomFieldAnswers(new HashSet<>());
        app.setInternalComments(new HashSet<>());
        return app;
    }

    /** Creates a new unsaved Application with all optional fields. Null = default. */
    public static Application newApplicationAll(
            Applicant applicant,
            Job job,
            ApplicationState state,
            LocalDate desiredStartDate,
            String projects,
            String specialSkills,
            String motivation,
            Set<CustomFieldAnswer> customFieldAnswers,
            Set<InternalComment> internalComments
    ) {
        Application app = newApplication(applicant, job);
        if (state != null) app.setState(state);
        if (desiredStartDate != null) app.setDesiredStartDate(desiredStartDate);
        if (projects != null) app.setProjects(projects);
        if (specialSkills != null) app.setSpecialSkills(specialSkills);
        if (motivation != null) app.setMotivation(motivation);
        if (customFieldAnswers != null) app.setCustomFieldAnswers(customFieldAnswers);
        if (internalComments != null) app.setInternalComments(internalComments);
        return app;
    }

    /** Creates and saves a new Application with default values. */
    public static Application saved(ApplicationRepository repo, Applicant applicant, Job job) {
        return repo.save(newApplication(applicant, job));
    }

    /** Creates and saves a fully configured Application. Nulls mean defaults. */
    public static Application savedAll(
            ApplicationRepository repo,
            Applicant applicant,
            Job job,
            ApplicationState state,
            LocalDate desiredStartDate,
            String projects,
            String specialSkills,
            String motivation,
            Set<CustomFieldAnswer> customFieldAnswers,
            Set<InternalComment> internalComments
    ) {
        return repo.save(newApplicationAll(
                applicant, job, state, desiredStartDate,
                projects, specialSkills, motivation,
                customFieldAnswers, internalComments
        ));
    }
}
