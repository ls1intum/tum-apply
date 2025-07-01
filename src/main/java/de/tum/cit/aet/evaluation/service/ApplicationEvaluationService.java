package de.tum.cit.aet.evaluation.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.util.OffsetPageRequest;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.evaluation.dto.*;
import de.tum.cit.aet.evaluation.repository.ApplicationEvaluationRepository;
import de.tum.cit.aet.evaluation.repository.JobEvaluationRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class ApplicationEvaluationService {

    private final ApplicationEvaluationRepository applicationEvaluationRepository;
    private final JobEvaluationRepository jobEvaluationRepository;

    private static final Set<ApplicationState> VIEWABLE_STATES = Set.of(
        ApplicationState.SENT,
        ApplicationState.IN_REVIEW,
        ApplicationState.ACCEPTED,
        ApplicationState.REJECTED
    );

    private static final Set<ApplicationState> REVIEW_STATES = Set.of(ApplicationState.SENT, ApplicationState.IN_REVIEW);

    private static final Set<String> SORTABLE_FIELDS = Set.of("rating", "createdAt", "applicant.lastName");

    /**
     * Accepts the specified application and updates its state.
     *
     * @param applicationId the ID of the application to accept
     * @param acceptDTO     the acceptance details
     * @param reviewingUser the user performing the review
     */
    public void acceptApplication(@NonNull UUID applicationId, @NonNull AcceptDTO acceptDTO, @NonNull User reviewingUser) {
        Application application = applicationEvaluationRepository
            .findById(applicationId)
            .orElseThrow(() -> new EntityNotFoundException("Application not found"));

        //TODO add authorization

        if (!REVIEW_STATES.contains(application.getState())) {
            throw new IllegalArgumentException("Application can not be reviewed");
        }

        application.setState(ApplicationState.ACCEPTED);
        setApplicationReview(application, reviewingUser, acceptDTO.message());
        applicationEvaluationRepository.save(application);

        if (acceptDTO.closeJob()) {
            System.out.println("Should close Job and reject all");
            //TODO integrate close job and reject all
        }
        //TODO add notification

    }

    /**
     * Rejects the specified application and updates its state.
     *
     * @param applicationId the ID of the application to reject
     * @param rejectDTO     the rejection details
     * @param reviewingUser the user performing the review
     */
    public void rejectApplication(@NonNull UUID applicationId, @NonNull RejectDTO rejectDTO, @NonNull User reviewingUser) {
        Application application = applicationEvaluationRepository
            .findById(applicationId)
            .orElseThrow(() -> new EntityNotFoundException("Application not found"));

        //TODO add authorization

        if (!REVIEW_STATES.contains(application.getState())) {
            throw new IllegalArgumentException("Application can not be reviewed");
        }

        application.setState(ApplicationState.REJECTED);
        setApplicationReview(application, reviewingUser, rejectDTO.reason().getValue());
        applicationEvaluationRepository.save(application);
        //TODO add notification
    }

    /**
     * Sets the review details for the given application.
     *
     * @param application   the application to review
     * @param reviewingUser the user performing the review
     * @param reason        the review reason or message
     */
    private void setApplicationReview(Application application, User reviewingUser, String reason) {
        ApplicationReview applicationReview = new ApplicationReview();
        applicationReview.setReviewedBy(reviewingUser);
        applicationReview.setReason(reason);

        application.setApplicationReview(applicationReview);
        applicationReview.setApplication(application);
    }

    /**
     * Retrieves a paginated and optionally sorted list of applications for a given research group.
     *
     * @param researchGroup the {@link ResearchGroup} whose applications are to be fetched
     * @param offsetPageDTO the {@link OffsetPageDTO} containing pagination information (offset and limit)
     * @param sortDTO the {@link SortDTO} specifying the sorting criteria
     * @param filterDTO the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return an {@link ApplicationEvaluationOverviewListDTO} containing application overviews
     * and the total number of matching records
     */
    public ApplicationEvaluationOverviewListDTO getAllApplicationsOverviews(
        ResearchGroup researchGroup,
        OffsetPageDTO offsetPageDTO,
        SortDTO sortDTO,
        EvaluationFilterDTO filterDTO
    ) {
        UUID researchGroupId = researchGroup.getResearchGroupId();

        Pageable pageable = new OffsetPageRequest(offsetPageDTO.offset(), offsetPageDTO.limit(), sortDTO.toSpringSort(SORTABLE_FIELDS));
        List<Application> applicationsPage = getApplicationsDetails(researchGroupId, pageable, filterDTO.getFilters());
        long totalRecords = getTotalRecords(researchGroupId, filterDTO.getFilters());

        return ApplicationEvaluationOverviewListDTO.fromApplications(applicationsPage, totalRecords);
    }

    /**
     * Retrieves a window of applications centered around a specific application for the given research group,
     * applying dynamic filters and sorting. The window size must be a positive odd integer.
     *
     * @param applicationId the ID of the application to center the window on
     * @param windowSize the desired size of the window (must be positive and odd)
     * @param researchGroup the {@link ResearchGroup} whose applications are to be fetched
     * @param sortDTO the {@link SortDTO} specifying the sorting criteria
     * @param filterDTO the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ApplicationEvaluationDetailListDTO} containing the applications in the window,
     *         total record count, the index of the target application, and its position in the window
     * @throws IllegalArgumentException if the window size is not a positive odd integer
     */
    public ApplicationEvaluationDetailListDTO getApplicationsDetailsWindow(
        UUID applicationId,
        Integer windowSize,
        ResearchGroup researchGroup,
        SortDTO sortDTO,
        EvaluationFilterDTO filterDTO
    ) {
        UUID researchGroupId = researchGroup.getResearchGroupId();
        long totalRecords = getTotalRecords(researchGroupId, filterDTO.getFilters());

        if (windowSize == null || windowSize <= 0 || (windowSize % 2) != 1) {
            throw new IllegalArgumentException("Window size must be a positive and odd integer");
        }
        long idx = applicationEvaluationRepository.findIndexOfApplication(
            applicationId,
            researchGroupId,
            VIEWABLE_STATES,
            sortDTO.toSpringSort(SORTABLE_FIELDS),
            filterDTO.getFilters()
        );

        // Calculate how many items to include before and after the target application
        int half = (int) Math.floor((double) windowSize / 2);

        // Compute the start index for the window (ensure it's not negative)
        int start = Math.max((int) idx - half, 0);

        // Compute the end index (exclusive), ensuring we don't exceed the total records
        int end = Math.min((int) idx + half + 1, (int) totalRecords);

        // Determine the position of the target application within the returned window list
        int windowIndex = (int) idx - start;

        // Create a Pageable with an offset (start index), limit (window size), and the sort criteria
        Pageable pageable = new OffsetPageRequest(start, end - start, sortDTO.toSpringSort(SORTABLE_FIELDS));

        List<Application> applicationsPage = getApplicationsDetails(researchGroupId, pageable, filterDTO.getFilters());
        return ApplicationEvaluationDetailListDTO.fromApplications(applicationsPage, totalRecords, (int) idx, windowIndex);
    }

    /**
     * Retrieves a paginated and filtered list of application evaluation details for the given research group.
     *
     * @param researchGroup the {@link ResearchGroup} whose applications are to be fetched
     * @param offsetPageDTO the {@link OffsetPageDTO} containing pagination information (offset and limit)
     * @param sortDTO the {@link SortDTO} specifying the sorting criteria
     * @param filterDTO the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ApplicationEvaluationDetailListDTO} containing the applications and total record count
     */
    public ApplicationEvaluationDetailListDTO getApplicationsDetails(
        ResearchGroup researchGroup,
        OffsetPageDTO offsetPageDTO,
        SortDTO sortDTO,
        EvaluationFilterDTO filterDTO
    ) {
        UUID researchGroupId = researchGroup.getResearchGroupId();

        Pageable pageable = new OffsetPageRequest(offsetPageDTO.offset(), offsetPageDTO.limit(), sortDTO.toSpringSort(SORTABLE_FIELDS));

        List<Application> applicationsPage = getApplicationsDetails(researchGroupId, pageable, filterDTO.getFilters());
        long totalRecords = getTotalRecords(researchGroupId, filterDTO.getFilters());
        return ApplicationEvaluationDetailListDTO.fromApplications(applicationsPage, totalRecords, null, null);
    }

    /**
     * Retrieves all job filter options associated with the given research group.
     *
     * @param researchGroup the {@link ResearchGroup} for which to retrieve job filter options
     * @return a set of {@link JobFilterOptionDTO} representing the available job filter options
     *         for the specified research group
     */
    public Set<JobFilterOptionDTO> getJobFilterOptions(ResearchGroup researchGroup) {
        return jobEvaluationRepository.findAllBYResearchGroup(researchGroup.getResearchGroupId());
    }

    /**
     * Helper method to retrieve a paginated list of applications in viewable states for the specified research group,
     * applying optional dynamic filters.
     *
     * @param researchGroupId the ID of the research group to filter applications by
     * @param pageable the {@link Pageable} object containing pagination and sorting information
     * @param dynamicFilters additional dynamic filters to apply
     * @return a list of matching {@link Application} entities
     */
    private List<Application> getApplicationsDetails(UUID researchGroupId, Pageable pageable, Map<String, List<?>> dynamicFilters) {
        return applicationEvaluationRepository.findApplications(researchGroupId, VIEWABLE_STATES, pageable, dynamicFilters);
    }

    /**
     * Helper method to count the total number of applications in viewable states for the specified research group,
     * applying optional dynamic filters.
     *
     * @param researchGroupId the ID of the research group to filter applications by
     * @param dynamicFilters additional dynamic filters to apply
     * @return the total count of matching applications
     */
    private long getTotalRecords(UUID researchGroupId, Map<String, List<?>> dynamicFilters) {
        return applicationEvaluationRepository.countApplications(researchGroupId, VIEWABLE_STATES, dynamicFilters);
    }
}
