package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.core.config.ApplicantRetentionProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicantRetentionJob {

    private final ApplicantRetentionProperties properties;

    @Scheduled(cron = "${user.retention.cron:0 27 3 * * *}", zone = "UTC")
    public void deleteApplicantData() {}
}
