package de.tum.cit.aet.interview.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.dto.BookingDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ApplicationTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class InterviewBookingResourceTest extends AbstractResourceTest {

    private static final String API_BASE_PATH = "/api/interviews/booking/";

    @Autowired
    private InterviewProcessRepository interviewProcessRepository;

    @Autowired
    private InterviewSlotRepository interviewSlotRepository;

    @Autowired
    private IntervieweeRepository intervieweeRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResearchGroupRepository researchGroupRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @Autowired
    private MvcTestClient api;

    private InterviewProcess interviewProcess;
    private User applicantUser;
    private Application application;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        ResearchGroup researchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Prof. Doe",
            "Algorithms Group",
            "ALG",
            "Munich",
            "CS",
            "We do cool stuff",
            "alg@example.com",
            "80333",
            "CIT",
            "Arcisstr. 21",
            "https://alg.tum.de",
            "ACTIVE"
        );

        User professor = UserTestData.savedProfessorAll(
            userRepository,
            researchGroup,
            null,
            "prof.doe@tum.de",
            "John",
            "Doe",
            "en",
            "+49 89 1234",
            "https://doe.tum.de",
            "https://linkedin.com/in/doe",
            "DE",
            null,
            "männlich",
            UUID.randomUUID().toString().replace("-", "").substring(0, 7)
        );

        Job job = JobTestData.saved(jobRepository, professor, researchGroup, "Software Engineer", JobState.PUBLISHED, LocalDate.now());

        interviewProcess = new InterviewProcess();
        interviewProcess.setJob(job);
        interviewProcess = interviewProcessRepository.save(interviewProcess);

        // Create applicant user and application
        Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
        applicantUser = applicant.getUser();
        application = ApplicationTestData.savedSent(applicationRepository, job, applicant);
    }

    @Nested
    class GetBookingData {

        @Test
        void getBookingDataAsInvitedApplicantReturnsData() {
            // Arrange
            createInvitedInterviewee();
            createFutureUnbookedSlot();
            createFutureUnbookedSlot();

            // Act
            BookingDTO result = api
                .with(JwtPostProcessors.jwtUser(applicantUser.getUserId(), "ROLE_APPLICANT"))
                .getAndRead(API_BASE_PATH + interviewProcess.getId(), null, BookingDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.jobTitle()).isEqualTo("Software Engineer");
            assertThat(result.researchGroupName()).isEqualTo("Algorithms Group");
            assertThat(result.supervisor()).isNotNull();
            assertThat(result.supervisor().firstName()).isEqualTo("John");
            assertThat(result.supervisor().lastName()).isEqualTo("Doe");
            assertThat(result.userBookingInfo().hasBookedSlot()).isFalse();
            assertThat(result.userBookingInfo().bookedSlot()).isNull();
            assertThat(result.availableSlots()).hasSize(2);
        }

        @Test
        void getBookingDataReturns403WhenNotInProcess() {
            // Arrange: No interviewee entry for this user

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(applicantUser.getUserId(), "ROLE_APPLICANT"))
                .getAndRead(API_BASE_PATH + interviewProcess.getId(), null, Void.class, 403);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void getBookingDataReturns403WhenUncontacted() {
            // Arrange: Create interviewee WITHOUT lastInvited (UNCONTACTED state)
            Interviewee interviewee = new Interviewee();
            interviewee.setInterviewProcess(interviewProcess);
            interviewee.setApplication(application);
            interviewee.setLastInvited(null);
            intervieweeRepository.save(interviewee);

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(applicantUser.getUserId(), "ROLE_APPLICANT"))
                .getAndRead(API_BASE_PATH + interviewProcess.getId(), null, Void.class, 403);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void getBookingDataReturns404WhenProcessNotFound() {
            // Arrange
            createInvitedInterviewee();

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(applicantUser.getUserId(), "ROLE_APPLICANT"))
                .getAndRead(API_BASE_PATH + UUID.randomUUID(), null, Void.class, 404);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void getBookingDataOnlyReturnsFutureUnbookedSlots() {
            // Arrange
            createInvitedInterviewee();

            // Create slots: 1 past, 1 booked, 2 future unbooked
            createPastSlot();

            InterviewSlot bookedSlot = createFutureUnbookedSlot();
            bookedSlot.setIsBooked(true);
            interviewSlotRepository.save(bookedSlot);

            createFutureUnbookedSlot();
            createFutureUnbookedSlot();

            // Act
            BookingDTO result = api
                .with(JwtPostProcessors.jwtUser(applicantUser.getUserId(), "ROLE_APPLICANT"))
                .getAndRead(API_BASE_PATH + interviewProcess.getId(), null, BookingDTO.class, 200);

            // Assert: Only 2 future unbooked slots
            assertThat(result.availableSlots()).hasSize(2);
            assertThat(result.userBookingInfo().hasBookedSlot()).isFalse();
        }
    }

    // ===================== Helper Methods =====================

    private Interviewee createInvitedInterviewee() {
        Interviewee interviewee = new Interviewee();
        interviewee.setInterviewProcess(interviewProcess);
        interviewee.setApplication(application);
        interviewee.setLastInvited(Instant.now());
        return intervieweeRepository.save(interviewee);
    }

    private InterviewSlot createFutureUnbookedSlot() {
        InterviewSlot slot = new InterviewSlot();
        slot.setInterviewProcess(interviewProcess);
        slot.setStartDateTime(Instant.now().plusSeconds(86400));
        slot.setEndDateTime(Instant.now().plusSeconds(90000));
        slot.setLocation("Room 101");
        slot.setIsBooked(false);
        return interviewSlotRepository.save(slot);
    }

    private InterviewSlot createPastSlot() {
        InterviewSlot slot = new InterviewSlot();
        slot.setInterviewProcess(interviewProcess);
        slot.setStartDateTime(Instant.now().minusSeconds(86400));
        slot.setEndDateTime(Instant.now().minusSeconds(82800));
        slot.setLocation("Room 102");
        slot.setIsBooked(false);
        return interviewSlotRepository.save(slot);
    }
}
