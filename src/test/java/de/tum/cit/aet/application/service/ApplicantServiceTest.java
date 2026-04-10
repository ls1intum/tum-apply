package de.tum.cit.aet.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.dto.UserDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApplicantServiceTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();

    @Mock
    private ApplicantRepository applicantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentDictionaryService documentDictionaryService;

    @Mock
    private DocumentService documentService;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private ApplicantService applicantService;

    private User user;
    private Applicant applicant;

    @BeforeEach
    void setUp() {
        user = UserTestData.newUserAll(TEST_USER_ID, "ada@example.com", "Ada", "Lovelace");
        user.setGender("Female");
        user.setNationality("British");
        user.setBirthday(LocalDate.of(1990, 12, 10));
        user.setPhoneNumber("+49123456789");
        user.setWebsite("https://original.example.com");
        user.setLinkedinUrl("https://linkedin.com/in/original");
        user.setSelectedLanguage("en");

        applicant = ApplicantTestData.newApplicant(user);
    }

    @Nested
    class UpdateApplicantApplicationInformation {

        @Test
        void shouldUpdateOnlyApplicationInformationFields() {
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(user));
            when(applicantRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(applicant));
            when(userRepository.save(user)).thenReturn(user);
            when(applicantRepository.save(applicant)).thenReturn(applicant);

            ApplicantDTO update = new ApplicantDTO(
                new UserDTO(
                    TEST_USER_ID,
                    "updated.personal@example.com",
                    null,
                    "Grace",
                    "Hopper",
                    "Other",
                    "American",
                    LocalDate.of(1985, 5, 5),
                    "+49999999999",
                    "https://personal.example.com",
                    "https://linkedin.com/in/personal",
                    "en",
                    null
                ),
                "Updated Street",
                "80333",
                "Munich",
                "Germany",
                "Should Be Ignored Bachelor",
                "9.0",
                "9.0",
                "9.0",
                "Should Be Ignored Bachelor University",
                "Should Be Ignored Master",
                "9.0",
                "9.0",
                "9.0",
                "Should Be Ignored Master University"
            );

            ApplicantDTO result = applicantService.updateApplicantApplicationInformation(update);

            assertThat(result.user().email()).isEqualTo("updated.personal@example.com");
            assertThat(result.user().firstName()).isEqualTo("Grace");
            assertThat(result.user().lastName()).isEqualTo("Hopper");
            assertThat(result.street()).isEqualTo("Updated Street");
            assertThat(result.postalCode()).isEqualTo("80333");
            assertThat(result.city()).isEqualTo("Munich");
            assertThat(result.country()).isEqualTo("Germany");
            assertThat(result.bachelorDegreeName()).isEqualTo("B.Sc. Computer Science");
            assertThat(result.bachelorGrade()).isEqualTo("1.7");
            assertThat(result.masterDegreeName()).isEqualTo("M.Sc. Informatics");
            assertThat(result.masterGrade()).isEqualTo("1.3");

            assertThat(user.getEmail()).isEqualTo("updated.personal@example.com");
            assertThat(user.getFirstName()).isEqualTo("Grace");
            assertThat(user.getLastName()).isEqualTo("Hopper");
            assertThat(applicant.getStreet()).isEqualTo("Updated Street");
            assertThat(applicant.getBachelorDegreeName()).isEqualTo("B.Sc. Computer Science");
            assertThat(applicant.getMasterUniversity()).isEqualTo("TUM");

            verify(userRepository).save(user);
            verify(applicantRepository).save(applicant);
        }
    }

    @Nested
    class UpdateApplicantDocumentSettings {

        @Test
        void shouldUpdateOnlyDocumentSettingsFields() {
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(applicantRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(applicant));
            when(applicantRepository.save(applicant)).thenReturn(applicant);

            ApplicantDTO update = new ApplicantDTO(
                new UserDTO(
                    TEST_USER_ID,
                    "ignored@example.com",
                    null,
                    "Ignored",
                    "Ignored",
                    "Other",
                    "French",
                    LocalDate.of(1988, 8, 8),
                    "+49888888888",
                    "https://ignored.example.com",
                    "https://linkedin.com/in/ignored",
                    "en",
                    null
                ),
                "Ignored Street",
                "99999",
                "Ignored City",
                "Ignored Country",
                "Updated Bachelor Degree",
                "1.0",
                "5.0",
                "1.2",
                "Updated Bachelor University",
                "Updated Master Degree",
                "1.0",
                "5.0",
                "1.1",
                "Updated Master University"
            );

            ApplicantDTO result = applicantService.updateApplicantDocumentSettings(update);

            assertThat(result.user().email()).isEqualTo("ada@example.com");
            assertThat(result.user().firstName()).isEqualTo("Ada");
            assertThat(result.street()).isEqualTo("Teststr. 1");
            assertThat(result.city()).isEqualTo("Munich");
            assertThat(result.bachelorDegreeName()).isEqualTo("Updated Bachelor Degree");
            assertThat(result.bachelorGrade()).isEqualTo("1.2");
            assertThat(result.bachelorUniversity()).isEqualTo("Updated Bachelor University");
            assertThat(result.masterDegreeName()).isEqualTo("Updated Master Degree");
            assertThat(result.masterGrade()).isEqualTo("1.1");
            assertThat(result.masterUniversity()).isEqualTo("Updated Master University");

            assertThat(user.getEmail()).isEqualTo("ada@example.com");
            assertThat(user.getFirstName()).isEqualTo("Ada");
            assertThat(applicant.getStreet()).isEqualTo("Teststr. 1");
            assertThat(applicant.getBachelorDegreeName()).isEqualTo("Updated Bachelor Degree");
            assertThat(applicant.getMasterUniversity()).isEqualTo("Updated Master University");

            verify(applicantRepository).save(applicant);
            verify(userRepository, never()).findById(any());
            verify(userRepository, never()).save(any());
        }
    }
}
