package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobFormDTO(UUID supervisingProfessor, String title, Campus location, FundingType fundingType, JobState state) {}
