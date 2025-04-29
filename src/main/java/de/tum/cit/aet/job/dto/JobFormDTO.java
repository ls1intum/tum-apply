package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.JobState;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobFormDTO(String title, Campus location, JobState state) {}
