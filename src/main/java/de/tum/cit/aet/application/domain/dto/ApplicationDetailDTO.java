package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import de.tum.cit.aet.reference.dto.ReferenceRequestDTO;
import de.tum.cit.aet.usermanagement.dto.ApplicantForApplicationDetailDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.hibernate.Hibernate;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationDetailDTO(
    @NotNull UUID applicationId,
    @NotNull UUID jobId,
    ApplicantForApplicationDetailDTO applicant,
    @NotNull ApplicationState applicationState,
    @NotNull String supervisingProfessorName,
    @NotNull String researchGroup,
    String jobTitle,
    Campus jobLocation,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation,
    int referenceLettersRequired,
    boolean referenceLettersConfidential,
    List<ReferenceRequestDTO> references,
    LocalDate jobEndDate
) {
    /**
     * Converts an Application entity to a detail DTO for the evaluation view, including reference letters.
     *
     * @param application the application entity
     * @param job         the associated job entity
     * @return the detail DTO
     */
    public static ApplicationDetailDTO getFromEntity(Application application, Job job) {
        return getFromEntity(application, job, true);
    }

    /**
     * Converts an Application entity to a detail DTO for the evaluation view.
     * Rich-text fields (projects, specialSkills, motivation) are sanitized on read
     * as defense-in-depth before sending to the client.
     *
     * @param application                       the application entity
     * @param job                               the associated job entity
     * @param includeReferenceLetterDocumentIds whether linked uploaded reference-letter ids should be exposed
     * @return the detail DTO
     */
    public static ApplicationDetailDTO getFromEntity(Application application, Job job, boolean includeReferenceLetterDocumentIds) {
        if (application == null) {
            throw new EntityNotFoundException("Application Entity should not be null");
        }

        return new ApplicationDetailDTO(
            application.getApplicationId(),
            job.getJobId(),
            ApplicantForApplicationDetailDTO.getFromApplicationSnapshot(application),
            application.getState(),
            job.getSupervisingProfessor().getFirstName() + " " + job.getSupervisingProfessor().getLastName(),
            job.getResearchGroup().getName(),
            job.getTitle(),
            job.getLocation(),
            application.getDesiredStartDate(),
            HtmlSanitizer.sanitize(application.getProjects()),
            HtmlSanitizer.sanitize(application.getSpecialSkills()),
            HtmlSanitizer.sanitize(application.getMotivation()),
            job.getReferenceLettersRequired(),
            application.isReferenceLettersConfidential(),
            mapReferences(application.getReferenceRequests(), includeReferenceLetterDocumentIds),
            job.getEndDate()
        );
    }

    /**
     * Maps the given set of reference request entities to a list of DTOs sorted by creation time.
     * If the collection is not initialized (e.g. because the caller did not eagerly load it),
     * returns an empty list to avoid LazyInitializationException.
     *
     * @param referenceRequests the set of reference request entities, possibly uninitialized
     * @return the list of reference request DTOs, or empty if the input was null, uninitialized, or empty
     */
    private static List<ReferenceRequestDTO> mapReferences(
        Set<ReferenceRequest> referenceRequests,
        boolean includeReferenceLetterDocumentIds
    ) {
        if (referenceRequests == null || !Hibernate.isInitialized(referenceRequests) || referenceRequests.isEmpty()) {
            return List.of();
        }
        return referenceRequests
            .stream()
            .sorted(Comparator.comparing(ReferenceRequest::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(referenceRequest -> ReferenceRequestDTO.fromEntity(referenceRequest, includeReferenceLetterDocumentIds))
            .toList();
    }
}
