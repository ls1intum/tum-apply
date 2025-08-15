package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

import java.time.LocalDate;

/**
 * Test data helpers for Job.
 */
public final class JobTestData {
    private JobTestData() {}

    /** Unsaved job with common defaults; pass title/state/startDate if you care. */
    public static Job newJob(User prof, ResearchGroup rg, String title, JobState state, LocalDate startDate) {
        Job j = new Job();
        j.setTitle(title != null ? title : "Default Title");
        j.setResearchArea("ML");
        j.setFieldOfStudies("CS");
        j.setLocation(Campus.GARCHING);
        j.setWorkload(20);
        j.setStartDate(startDate != null ? startDate : LocalDate.now());
        j.setState(state != null ? state : JobState.DRAFT);
        j.setSupervisingProfessor(prof);
        j.setResearchGroup(rg);
        return j;
    }

    /** Unsaved job; every field optional (null = keep default). */
    public static Job newJobAll(
        String title,
        String researchArea,
        String fieldOfStudies,
        User supervisingProfessor,
        ResearchGroup researchGroup,
        Campus location,
        LocalDate startDate,
        LocalDate endDate,
        Integer workload,
        Integer contractDuration,
        FundingType fundingType,
        String description,
        String tasks,
        String requirements,
        JobState state
    ) {
        Job j = newJob(supervisingProfessor, researchGroup, title, state, startDate);
        if (researchArea != null) j.setResearchArea(researchArea);
        if (fieldOfStudies != null) j.setFieldOfStudies(fieldOfStudies);
        if (location != null) j.setLocation(location);
        if (endDate != null) j.setEndDate(endDate);
        if (workload != null) j.setWorkload(workload);
        if (contractDuration != null) j.setContractDuration(contractDuration);
        if (fundingType != null) j.setFundingType(fundingType);
        if (description != null) j.setDescription(description);
        if (tasks != null) j.setTasks(tasks);
        if (requirements != null) j.setRequirements(requirements);
        return j;
    }

    // --- Saved variants -------------------------------------------------------------------------
    public static Job saved(JobRepository repo, User prof, ResearchGroup rg, String title, JobState state, LocalDate startDate) {
        return repo.save(newJob(prof, rg, title, state, startDate));
    }

    public static Job savedAll(
        JobRepository repo,
        String title, String researchArea, String fieldOfStudies,
        User supervisingProfessor, ResearchGroup researchGroup,
        Campus location, LocalDate startDate, LocalDate endDate,
        Integer workload, Integer contractDuration, FundingType fundingType,
        String description, String tasks, String requirements, JobState state
    ) {
        return repo.save(newJobAll(title, researchArea, fieldOfStudies, supervisingProfessor, researchGroup,
            location, startDate, endDate, workload, contractDuration, fundingType,
            description, tasks, requirements, state));
    }
}
