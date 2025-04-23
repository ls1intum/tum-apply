package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.domain.CustomField;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobDetailDTO(
    String title,
    String researchArea,
    String fieldOfStudies,
    UUID professorId,
    String location,
    Instant startDate,
    Instant applicationDeadline,
    String employmentType,
    int workload,
    int contractDuration,
    String fundingType,
    String description,
    String tasks,
    String applicationRequirements,
    String qualifications,
    String introduction,
    String aboutUs,
    String weOffer,
    String contactName,
    String contactEmail,
    String contactPhoneNumber,
    String contactWebsite,
    // TODO: Adjust this to a List of CustomFields
    CustomField customFields
) {}
