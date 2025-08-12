package de.tum.cit.aet.utility;

import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

import java.time.LocalDate;

public final class JobTestData {
    private JobTestData() {}

    public static Job job(User prof, ResearchGroup rg, String title, JobState state, LocalDate start) {
        Job j = new Job();
        j.setTitle(title);
        j.setResearchArea("ML");
        j.setFieldOfStudies("CS");
        j.setLocation(Campus.GARCHING);
        j.setWorkload(20);
        j.setStartDate(start);
        j.setState(state);
        j.setSupervisingProfessor(prof);
        j.setResearchGroup(rg); // NOT NULL FK
        return j;
    }

    public static Job saved(JobRepository repo, User prof, ResearchGroup rg, String title, JobState state, LocalDate start) {
        return repo.save(job(prof, rg, title, state, start));
    }
}
