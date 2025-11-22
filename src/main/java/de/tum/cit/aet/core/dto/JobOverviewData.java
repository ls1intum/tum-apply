package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobOverviewData(
    String supervisor,
    String location,
    String fieldsOfStudies,
    String researchArea,
    String workload,
    String duration,
    String fundingType,
    String startDate,
    String endDate
) {}
