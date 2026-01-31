package de.tum.cit.aet.core.retention;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.IntegrationTest;
import de.tum.cit.aet.core.config.UserRetentionProperties;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class UserRetentionJobIntegrationTest {

    private static final UUID DELETED_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000100");

    @Autowired
    private UserRetentionJob userRetentionJob;

    @Autowired
    private UserRetentionProperties properties;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @BeforeEach
    void setUp() {
        properties.setEnabled(true);
        properties.setDryRun(false);
        properties.setInactiveDaysBeforeDeletion(1);
        properties.setBatchSize(10);
        properties.setMaxRuntimeMinutes(1);
        properties.setDeletedUserId(DELETED_USER_ID);
        ensureDeletedUserExists();
    }

    @Test
    void shouldRespectDryRunWhenEnabled() {
        User user = ApplicantTestData.saveApplicantWithLastActivity(
            "dryrun-job@test.local",
            applicantRepository,
            userRepository,
            LocalDateTime.now(ZoneOffset.UTC).minusDays(2)
        );

        properties.setDryRun(true);
        userRetentionJob.deleteUserData();

        assertThat(userRepository.existsById(user.getUserId())).isTrue();
        assertThat(applicantRepository.findById(user.getUserId())).isPresent();

        properties.setDryRun(false);
        userRetentionJob.deleteUserData();

        assertThat(userRepository.existsById(user.getUserId())).isFalse();
        assertThat(applicantRepository.findById(user.getUserId())).isEmpty();
    }

    @Test
    void shouldOnlyDeleteUsersBeforeCutoff() {
        User oldUser = ApplicantTestData.saveApplicantWithLastActivity(
            "old-user@test.local",
            applicantRepository,
            userRepository,
            LocalDateTime.now(ZoneOffset.UTC).minusDays(3)
        );
        User recentUser = ApplicantTestData.saveApplicantWithLastActivity(
            "recent-user@test.local",
            applicantRepository,
            userRepository,
            LocalDateTime.now(ZoneOffset.UTC).minusHours(6)
        );

        userRetentionJob.deleteUserData();

        assertThat(userRepository.existsById(oldUser.getUserId())).isFalse();
        assertThat(applicantRepository.findById(oldUser.getUserId())).isEmpty();

        assertThat(userRepository.existsById(recentUser.getUserId())).isTrue();
        assertThat(applicantRepository.findById(recentUser.getUserId())).isPresent();
    }

    private void ensureDeletedUserExists() {
        if (userRepository.existsById(DELETED_USER_ID)) {
            return;
        }
        User deleted = new User();
        deleted.setUserId(DELETED_USER_ID);
        deleted.setEmail("deleted@user");
        deleted.setFirstName("Deleted");
        deleted.setLastName("User");
        deleted.setSelectedLanguage("en");
        userRepository.save(deleted);
    }
}
