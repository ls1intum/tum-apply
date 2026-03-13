package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.dto.exportdata.ApplicantDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantInternalCommentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantRatingExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantReviewExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.DocumentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.IntervieweeExportDTO;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
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
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final ApplicationRepository applicationRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final RatingRepository ratingRepository;
    private final InternalCommentRepository internalCommentRepository;

    @Override
    public void contribute(ExportContext context, UserDataExportBuilder builder) {
        if (!context.hasApplicantRole() || !applicantRepository.existsById(context.user().getUserId())) {
            return;
        }
        builder.withApplicantData(buildApplicantData(context.user().getUserId()));
    }

    private ApplicantDataExportDTO buildApplicantData(UUID userId) {
        Applicant applicant = applicantRepository.findById(userId).orElseThrow();

        Set<DocumentExportDTO> documents = documentDictionaryRepository
            .findAllByApplicant(applicant)
            .stream()
            .map(dd ->
                new DocumentExportDTO(
                    dd.getDocument().getDocumentId(),
                    dd.getName(),
                    dd.getDocumentType(),
                    dd.getDocument().getMimeType(),
                    dd.getDocument().getSizeBytes()
                )
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
            interviewees
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
                new IntervieweeExportDTO(interviewee.getInterviewProcess().getJob().getTitle(), interviewee.getLastInvited())
            )
            .toList();
    }
}
