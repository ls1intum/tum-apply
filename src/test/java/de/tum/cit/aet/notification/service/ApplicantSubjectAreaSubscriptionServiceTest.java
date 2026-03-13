package de.tum.cit.aet.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.application.service.ApplicantService;
import de.tum.cit.aet.core.domain.CurrentUser;
import de.tum.cit.aet.core.domain.ResearchGroupRole;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.InvalidParameterException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.notification.domain.ApplicantSubjectAreaSubscription;
import de.tum.cit.aet.notification.dto.ApplicantSubjectAreaSubscriptionDTO;
import de.tum.cit.aet.notification.repository.ApplicantSubjectAreaSubscriptionRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApplicantSubjectAreaSubscriptionServiceTest {

    @Mock
    private ApplicantSubjectAreaSubscriptionRepository applicantSubjectAreaSubscriptionRepository;

    @Mock
    private ApplicantService applicantService;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private ApplicantSubjectAreaSubscriptionService applicantSubjectAreaSubscriptionService;

    private Applicant applicant;
    private UUID userId;

    @BeforeEach
    void setup() {
        userId = UUID.randomUUID();

        applicant = new Applicant();
        applicant.setUserId(userId);

        lenient()
            .when(currentUserService.getCurrentUser())
            .thenReturn(
                new CurrentUser(
                    userId,
                    "applicant@example.com",
                    "Ada",
                    "Lovelace",
                    List.of(new ResearchGroupRole(UserRole.APPLICANT, null))
                )
            );
        lenient().when(currentUserService.getUserId()).thenReturn(userId);
        lenient().when(applicantService.findOrCreateApplicant(userId)).thenReturn(applicant);
    }

    @Test
    void getCurrentApplicantSubscriptionsReturnsSortedSubjectAreas() {
        ApplicantSubjectAreaSubscription mathematics = subscription(SubjectArea.MATHEMATICS);
        ApplicantSubjectAreaSubscription computerScience = subscription(SubjectArea.COMPUTER_SCIENCE);

        when(applicantSubjectAreaSubscriptionRepository.findAllByApplicantOrderBySubjectAreaAsc(applicant)).thenReturn(
            List.of(mathematics, computerScience)
        );

        ApplicantSubjectAreaSubscriptionDTO result = applicantSubjectAreaSubscriptionService.getCurrentApplicantSubscriptions();

        assertThat(result.subjectAreas()).containsExactly(SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS);
    }

    @Test
    void updateCurrentApplicantSubscriptionsDeduplicatesAndSortsInput() {
        ApplicantSubjectAreaSubscriptionDTO dto = new ApplicantSubjectAreaSubscriptionDTO(
            List.of(SubjectArea.MATHEMATICS, SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS)
        );

        when(applicantSubjectAreaSubscriptionRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicantSubjectAreaSubscriptionDTO result = applicantSubjectAreaSubscriptionService.updateCurrentApplicantSubscriptions(dto);

        assertThat(result.subjectAreas()).containsExactly(SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS);
        verify(applicantSubjectAreaSubscriptionRepository).deleteByApplicant(applicant);
    }

    @Test
    void updateCurrentApplicantSubscriptionsRejectsNullEntry() {
        ApplicantSubjectAreaSubscriptionDTO dto = new ApplicantSubjectAreaSubscriptionDTO(
            Arrays.asList(SubjectArea.COMPUTER_SCIENCE, null)
        );

        assertThatThrownBy(() -> applicantSubjectAreaSubscriptionService.updateCurrentApplicantSubscriptions(dto))
            .isInstanceOf(InvalidParameterException.class)
            .hasMessageContaining("must not contain null values");
    }

    @Test
    void getCurrentApplicantSubscriptionsRejectsNonApplicantUsers() {
        when(currentUserService.getCurrentUser()).thenReturn(
            new CurrentUser(
                userId,
                "prof@example.com",
                "Prof",
                "User",
                List.of(new ResearchGroupRole(UserRole.PROFESSOR, UUID.randomUUID()))
            )
        );

        assertThatThrownBy(() -> applicantSubjectAreaSubscriptionService.getCurrentApplicantSubscriptions())
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("Only applicants");
    }

    private ApplicantSubjectAreaSubscription subscription(SubjectArea subjectArea) {
        ApplicantSubjectAreaSubscription subscription = new ApplicantSubjectAreaSubscription();
        subscription.setApplicant(applicant);
        subscription.setSubjectArea(subjectArea);
        return subscription;
    }
}
