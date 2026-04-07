package de.tum.cit.aet.core.retention;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.annotation.Scheduled;

class UserRetentionJobSchedulingIntegrationTest {

    @Test
    void deleteUserDataShouldHaveScheduledAnnotation() throws NoSuchMethodException {
        Method method = UserRetentionJob.class.getMethod("deleteUserData");
        Scheduled scheduled = method.getAnnotation(Scheduled.class);
        assertThat(scheduled).isNotNull();
        assertThat(scheduled.cron()).isEqualTo("${user.retention.cron:0 17 3 * * *}");
        assertThat(scheduled.zone()).isEqualTo("UTC");
    }

    @Test
    void warnUserOfDataDeletionShouldHaveScheduledAnnotation() throws NoSuchMethodException {
        Method method = UserRetentionJob.class.getMethod("warnUserOfDataDeletion");
        Scheduled scheduled = method.getAnnotation(Scheduled.class);
        assertThat(scheduled).isNotNull();
        assertThat(scheduled.cron()).isEqualTo("${user.retention.cron:0 0 3 * * *}");
        assertThat(scheduled.zone()).isEqualTo("UTC");
    }
}
