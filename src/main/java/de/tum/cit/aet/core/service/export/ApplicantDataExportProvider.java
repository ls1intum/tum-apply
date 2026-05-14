package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.documents.service.DocumentService;
import de.tum.cit.aet.core.dto.exportdata.ApplicantDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantInternalCommentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantRatingExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantReferenceRequestExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantReviewExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.DocumentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.IntervieweeExportDTO;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import de.tum.cit.aet.reference.repository.ReferenceRequestRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicantDataExportProvider implements UserDataSectionProvider {

    private final ApplicantRepository applicantRepository;
    private final DocumentService documentService;
    private final ApplicationRepository applicationRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final RatingRepository ratingRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final ReferenceRequestRepository referenceRequestRepository;

    @Override
    public void contribute(ExportContext context, UserDataExportBuilder builder) {
        if (!context.hasApplicantRole() || !applicantRepository.existsById(context.user().getUserId())) {
            return;
        }
        builder.withApplicantData(buildApplicantData(context.user().getUserId()));
    }

    private ApplicantDataExportDTO buildApplicantData(UUID userId) {
        Applicant applicant = applicantRepository.findById(userId).orElseThrow();

        Set<DocumentExportDTO> documents = documentService
            .listForApplicant(applicant)
            .stream()
            .map(doc ->
                new DocumentExportDTO(doc.getDocumentId(), doc.getName(), doc.getDocumentType(), doc.getMimeType(), doc.getSizeBytes())
            )
            .collect(Collectors.toSet());

        List<ApplicationExportDTO> applications = applicationRepository
            .findAllByApplicantId(userId)
            .stream()
            .map(application ->
                new ApplicationExportDTO(
                    application.getJob().getTitle(),
                    application.getState(),
                    application.getDesiredStartDate(),
                    application.getMotivation(),
                    application.getSpecialSkills(),
                    application.getProjects(),
                    getReview(application.getApplicationId()),
                    getRatings(application.getApplicationId()),
                    getInternalComments(application.getApplicationId())
                )
            )
            .toList();

        List<IntervieweeExportDTO> interviewees = getInterviewees(userId);
        List<String> subjectAreaSubscriptions = getSubjectAreaSubscriptions(applicant);
        List<ApplicantReferenceRequestExportDTO> referenceRequests = getReferenceRequests(userId);

        return new ApplicantDataExportDTO(
            applicant.getStreet(),
            applicant.getPostalCode(),
            applicant.getCity(),
            applicant.getCountry(),
            applicant.getBachelorDegreeName(),
            applicant.getBachelorGradeUpperLimit(),
            applicant.getBachelorGradeLowerLimit(),
            applicant.getBachelorGrade(),
            applicant.getBachelorUniversity(),
            applicant.getMasterDegreeName(),
            applicant.getMasterGradeUpperLimit(),
            applicant.getMasterGradeLowerLimit(),
            applicant.getMasterGrade(),
            applicant.getMasterUniversity(),
            documents,
            applications,
            interviewees,
            subjectAreaSubscriptions,
            referenceRequests
        );
    }

    private List<ApplicantReferenceRequestExportDTO> getReferenceRequests(UUID applicantUserId) {
        return applicationRepository
            .findAllByApplicantId(applicantUserId)
            .stream()
            .flatMap(application ->
                referenceRequestRepository
                    .findByApplicationApplicationIdOrderByCreatedAtAsc(application.getApplicationId())
                    .stream()
                    .map(entry -> toReferenceRequestExportDto(application, entry))
            )
            .toList();
    }

    private ApplicantReferenceRequestExportDTO toReferenceRequestExportDto(Application application, ReferenceRequest entry) {
        return new ApplicantReferenceRequestExportDTO(
            application.getJob() != null ? application.getJob().getTitle() : null,
            entry.getTitle(),
            entry.getFirstName(),
            entry.getLastName(),
            entry.getEmail(),
            entry.getStatus()
        );
    }

    private ApplicantReviewExportDTO getReview(UUID applicationId) {
        return applicationReviewRepository
            .findByApplicationApplicationId(applicationId)
            .map(review -> new ApplicantReviewExportDTO(review.getReason(), review.getReviewedAt()))
            .orElse(null);
    }

    private List<ApplicantRatingExportDTO> getRatings(UUID applicationId) {
        return ratingRepository
            .findByApplicationApplicationId(applicationId)
            .stream()
            .map(rating ->
                new ApplicantRatingExportDTO(
                    rating.getRating(),
                    rating.getCreatedAt() != null ? rating.getCreatedAt().toInstant(ZoneOffset.UTC) : null
                )
            )
            .toList();
    }

    private List<ApplicantInternalCommentExportDTO> getInternalComments(UUID applicationId) {
        return internalCommentRepository
            .findAllByApplicationApplicationIdOrderByCreatedAtAsc(applicationId)
            .stream()
            .map(comment ->
                new ApplicantInternalCommentExportDTO(
                    comment.getMessage(),
                    comment.getCreatedAt() != null ? comment.getCreatedAt().toInstant(ZoneOffset.UTC) : null
                )
            )
            .toList();
    }

    private List<IntervieweeExportDTO> getInterviewees(UUID userId) {
        return intervieweeRepository
            .findByApplicantUserIdWithDetails(userId)
            .stream()
            .map(interviewee ->
                new IntervieweeExportDTO(
                    interviewee.getInterviewProcess().getJob().getTitle(),
                    interviewee.getLastInvited(),
                    interviewee.getRating() != null ? interviewee.getRating().name() : null,
                    interviewee.getAssessmentNotes()
                )
            )
            .toList();
    }

    private List<String> getSubjectAreaSubscriptions(Applicant applicant) {
        return applicant.getSubjectAreaSubscriptions().stream().sorted().map(Enum::name).toList();
    }
}
