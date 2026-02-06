package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.core.dto.exportdata.ApplicationReviewExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InternalCommentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InterviewProcessExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InterviewSlotExportDTO;
import de.tum.cit.aet.core.dto.exportdata.RatingExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ResearchGroupRoleExportDTO;
import de.tum.cit.aet.core.dto.exportdata.StaffDataDTO;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StaffDataExportProvider implements UserDataSectionProvider {

    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final RatingRepository ratingRepository;
    private final InterviewProcessRepository interviewProcessRepository;
    private final InterviewSlotRepository interviewSlotRepository;

    @Override
    public void contribute(ExportContext context, UserDataExportBuilder builder) {
        if (!context.hasStaffRole()) {
            return;
        }
        StaffDataDTO staffData = buildStaffData(context.user());
        if (staffData != null) {
            builder.withStaffData(staffData);
        }
    }

    private StaffDataDTO buildStaffData(User user) {
        List<String> supervisedJobs = user.getPostedJobs().stream().map(Job::getTitle).toList();
        List<ResearchGroupRoleExportDTO> researchGroupRoles = getResearchGroupRoles(user);
        List<ApplicationReviewExportDTO> reviews = getReviews(user);
        List<InternalCommentExportDTO> comments = getComments(user);
        List<RatingExportDTO> ratings = getRatings(user);
        List<InterviewProcess> interviewProcessEntities = getInterviewProcesses(user);
        List<InterviewProcessExportDTO> interviewProcesses = mapInterviewProcesses(interviewProcessEntities);
        List<InterviewSlotExportDTO> interviewSlots = getInterviewSlots(interviewProcessEntities);

        if (
            supervisedJobs.isEmpty() &&
            researchGroupRoles.isEmpty() &&
            reviews.isEmpty() &&
            comments.isEmpty() &&
            ratings.isEmpty() &&
            interviewProcesses.isEmpty() &&
            interviewSlots.isEmpty()
        ) {
            return null;
        }

        return new StaffDataDTO(supervisedJobs, researchGroupRoles, reviews, comments, ratings, interviewProcesses, interviewSlots);
    }

    private List<InterviewProcess> getInterviewProcesses(User user) {
        List<InterviewProcess> processes = interviewProcessRepository.findAllByProfessorId(user.getUserId());
        return processes == null ? List.of() : processes;
    }

    private List<InterviewProcessExportDTO> mapInterviewProcesses(List<InterviewProcess> processes) {
        if (processes == null || processes.isEmpty()) {
            return List.of();
        }
        return processes
            .stream()
            .map(process -> new InterviewProcessExportDTO(process.getJob().getTitle()))
            .toList();
    }

    private List<InterviewSlotExportDTO> getInterviewSlots(List<InterviewProcess> interviewProcesses) {
        if (interviewProcesses == null || interviewProcesses.isEmpty()) {
            return List.of();
        }
        List<UUID> processIds = interviewProcesses.stream().map(InterviewProcess::getId).toList();
        List<InterviewSlot> slots = interviewSlotRepository.findByInterviewProcessIdInWithJob(processIds);
        if (slots == null || slots.isEmpty()) {
            return List.of();
        }
        return slots
            .stream()
            .map(slot ->
                new InterviewSlotExportDTO(
                    slot.getInterviewProcess().getJob().getTitle(),
                    slot.getStartDateTime().atZone(java.time.ZoneId.of("Europe/Berlin")),
                    slot.getEndDateTime().atZone(java.time.ZoneId.of("Europe/Berlin")),
                    slot.getLocation(),
                    slot.getStreamLink(),
                    slot.getIsBooked()
                )
            )
            .toList();
    }

    private List<ResearchGroupRoleExportDTO> getResearchGroupRoles(User user) {
        return userResearchGroupRoleRepository
            .findAllByUser(user)
            .stream()
            .filter(role -> role.getResearchGroup() != null)
            .map(role ->
                new ResearchGroupRoleExportDTO(
                    role.getResearchGroup().getName() != null ? role.getResearchGroup().getName() : "",
                    role.getRole()
                )
            )
            .toList();
    }

    private List<ApplicationReviewExportDTO> getReviews(User user) {
        return applicationReviewRepository
            .findAllByReviewedBy(user)
            .stream()
            .map(review ->
                new ApplicationReviewExportDTO(
                    review.getApplication().getJob().getTitle(),
                    review.getApplication().getApplicant().getUser().getFirstName() +
                        " " +
                        review.getApplication().getApplicant().getUser().getLastName(),
                    review.getReason(),
                    review.getReviewedAt()
                )
            )
            .toList();
    }

    private List<InternalCommentExportDTO> getComments(User user) {
        return internalCommentRepository
            .findAllByCreatedBy(user)
            .stream()
            .map(comment ->
                new InternalCommentExportDTO(
                    comment.getApplication().getJob().getTitle(),
                    comment.getApplication().getApplicant().getUser().getFirstName() +
                        " " +
                        comment.getApplication().getApplicant().getUser().getLastName(),
                    comment.getMessage(),
                    comment.getCreatedAt().toInstant(ZoneOffset.UTC)
                )
            )
            .toList();
    }

    private List<RatingExportDTO> getRatings(User user) {
        return ratingRepository
            .findAllByFrom(user)
            .stream()
            .map(rating ->
                new RatingExportDTO(
                    rating.getApplication().getJob().getTitle(),
                    rating.getApplication().getApplicant().getUser().getFirstName() +
                        " " +
                        rating.getApplication().getApplicant().getUser().getLastName(),
                    rating.getRating(),
                    rating.getCreatedAt().toInstant(ZoneOffset.UTC)
                )
            )
            .toList();
    }
}
