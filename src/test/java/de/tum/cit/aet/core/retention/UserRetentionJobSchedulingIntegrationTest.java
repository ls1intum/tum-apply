package de.tum.cit.aet.core.retention;

import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import de.tum.cit.aet.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.TestPropertySource;

@IntegrationTest
@TestPropertySource(properties = { "user.retention.enabled=false", "user.retention.cron=*/1 * * * * *" })
class UserRetentionJobSchedulingIntegrationTest {

    @SuppressWarnings("removal")
    @SpyBean
    private UserRetentionJob userRetentionJob;

    @Test
    void shouldTriggerScheduledJob() {
        verify(userRetentionJob, timeout(5000).atLeastOnce()).deleteUserData();
    }
}
