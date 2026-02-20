package de.tum.cit.aet.utility.testdata;

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

    /**
     * Creates an unsaved Job with common default values. Title, state, and
     * startDate can be overridden (null = default).
     */
    public static Job newJob(User prof, ResearchGroup rg, String title, JobState state, LocalDate startDate) {
        Job j = new Job();
        j.setTitle(title != null ? title : "Default Title");
        j.setResearchArea("ML");
        j.setFieldOfStudies("CS");
        j.setLocation(Campus.GARCHING);
        j.setWorkload(20);
        j.setContractDuration(3);
        j.setStartDate(startDate != null ? startDate : LocalDate.now());
        j.setState(state != null ? state : JobState.DRAFT);
        j.setSupervisingProfessor(prof);
        j.setResearchGroup(rg);
        j.setSuitableForDisabled(true);
        return j;
    }

    /**
     * Creates an unsaved Job with only necessary values.
     */
    public static Job newJobNull(User prof, ResearchGroup rg) {
        Job j = new Job();
        j.setTitle("Default Title");
        j.setResearchArea(null);
        j.setFieldOfStudies(null);
        j.setLocation(null);
        j.setWorkload(null);
        j.setContractDuration(null);
        j.setStartDate(null);
        j.setState(JobState.DRAFT);
        j.setSupervisingProfessor(prof);
        j.setResearchGroup(rg);
        j.setSuitableForDisabled(true);
        return j;
    }

    /**
     * Unsaved job; every field optional (null = keep default).
     */
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
        String jobDescriptionEN,
        String jobDescriptionDE,
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
        if (jobDescriptionEN != null) j.setJobDescriptionEN(jobDescriptionEN);
        if (jobDescriptionDE != null) j.setJobDescriptionDE(jobDescriptionDE);
        return j;
    }

    // --- Saved variants
    // -------------------------------------------------------------------------
    public static Job saved(JobRepository repo, User prof, ResearchGroup rg, String title, JobState state, LocalDate startDate) {
        return repo.save(newJob(prof, rg, title, state, startDate));
    }

    public static Job savedNull(JobRepository repo, User prof, ResearchGroup rg) {
        return repo.save(newJobNull(prof, rg));
    }

    public static Job savedAll(
        JobRepository repo,
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
        String jobDescriptionEN,
        String jobDescriptionDE,
        JobState state
    ) {
        return repo.save(
            newJobAll(
                title,
                researchArea,
                fieldOfStudies,
                supervisingProfessor,
                researchGroup,
                location,
                startDate,
                endDate,
                workload,
                contractDuration,
                fundingType,
                jobDescriptionEN,
                jobDescriptionDE,
                state
            )
        );
    }
}
