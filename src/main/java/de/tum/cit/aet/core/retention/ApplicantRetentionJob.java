package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.config.ApplicantRetentionProperties;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicantRetentionJob {

    private static final int DAYS_BEFORE_DELETION_WARNING = 28;

    private final ApplicantRetentionProperties properties;
    private final ApplicantRetentionService applicantRetentionService;
    private final ApplicationRepository applicationRepository;

    /**
     * Scheduled job that performs applicant retention cleanup based on configured settings.
     * <p>
     * If retention is disabled or no valid run configuration is available, the method exits early.
     * Otherwise, it builds a run configuration, processes candidate records within the maximum
     * runtime window, and logs a summary including dry-run status, cutoff timestamp, number of
     * candidates seen, actual runtime, and configured maximum runtime.
     */
    // Runs daily at 03:27 UTC (override with applicant.retention.cron)
    @Scheduled(cron = "${applicant.retention.cron:0 27 3 * * *}", zone = "UTC")
    public void deleteApplicantData() {
        if (!Boolean.TRUE.equals(properties.getEnabled())) {
            return;
        }

        ApplicationRunConfig config = buildRunConfig();
        if (config == null) {
            return;
        }

        Instant start = Instant.now();
        Instant deadline = start.plus(Duration.ofMinutes(config.maxRuntimeMinutes()));

        ApplicationRunResult result = processApplications(config, deadline);

        Duration runtime = Duration.between(start, Instant.now());

        log.info(
            "Applicant retention run finished: enabled=true dryRun={} cutoff={} applicationsSeen={} runtimeMs={} maxRuntimeMinutes={}",
            config.dryRun(),
            config.cutoff(),
            result.totalCandidatesSeen(),
            runtime.toMillis(),
            config.maxRuntimeMinutes()
        );
    }

    /**
     * Warns applicants exactly 28 days before their data deletion date.
     * <p>
     * Runs daily (configurable via {@code applicant.retention.cron}), computes the warning date as
     * {@code nowUtc - (daysBeforeDeletion - 28)}, and invokes
     * {@link ApplicantRetentionService#warnApplicantOfDataDeletion(LocalDateTime)}.
     * The repository compares only the calendar date (ignoring time), so warnings fire once on that day.
     * Skips execution when {@code daysBeforeDeletion} is not set or below the 28-day warning offset.
     * </p>
     */
    @Scheduled(cron = "${applicant.retention.cron:0 27 3 * * *}", zone = "UTC")
    public void warnApplicantOfDataDeletion() {
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        Integer daysBeforeDeletion = properties.getDaysBeforeDeletion();
        if (daysBeforeDeletion == null || daysBeforeDeletion <= DAYS_BEFORE_DELETION_WARNING) {
            log.warn("Applicant retention warning skipped: invalid daysBeforeDeletion value={}", daysBeforeDeletion);
            return;
        }

        LocalDateTime warningCutoff = nowUtc.minusDays(daysBeforeDeletion - DAYS_BEFORE_DELETION_WARNING);

        applicantRetentionService.warnApplicantOfDataDeletion(warningCutoff);
    }

    // ------------ Helper methods ------------

    private ApplicationRunConfig buildRunConfig() {
        Integer daysBeforeDeletion = properties.getDaysBeforeDeletion();
        Boolean enabled = properties.getEnabled();
        boolean dryRun = Boolean.TRUE.equals(properties.getDryRun());
        Integer batchSize = properties.getBatchSize();
        Integer maxRuntimeMinutes = properties.getMaxRuntimeMinutes();

        if (daysBeforeDeletion == null || daysBeforeDeletion <= 0) {
            log.warn("Applicant retention enabled, but daysBeforeDeletion is not configured (value={})", daysBeforeDeletion);
            return null;
        }
        if (batchSize == null || batchSize <= 0) {
            log.warn("Applicant retention enabled, but batchSize is not configured (value={})", batchSize);
            return null;
        }
        if (maxRuntimeMinutes == null || maxRuntimeMinutes <= 0) {
            log.warn("Applicant retention enabled, but maxRuntimeMinutes is not configured (value={})", maxRuntimeMinutes);
            return null;
        }

        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime cutoff = nowUtc.minusDays(daysBeforeDeletion);

        return new ApplicationRunConfig(daysBeforeDeletion, enabled, dryRun, batchSize, maxRuntimeMinutes, cutoff);
    }

    private ApplicationRunResult processApplications(ApplicationRunConfig config, Instant deadline) {
        long totalCandidatesSeen = 0;
        int pageNumber = 0;

        while (Instant.now().isBefore(deadline)) {
            PageRequest pageRequest = config.dryRun()
                ? PageRequest.of(pageNumber, config.batchSize())
                : PageRequest.of(0, config.batchSize());

            Slice<UUID> applicationIds = applicationRepository.findApplicationsToBeDeletedBeforeCutoff(config.cutoff(), pageRequest);
            if (applicationIds.isEmpty()) {
                break;
            }

            totalCandidatesSeen += applicationIds.getNumberOfElements();

            applicantRetentionService.processApplications(applicationIds, config.dryRun(), config.cutoff());

            if (config.dryRun()) {
                if (!applicationIds.hasNext()) {
                    break;
                }
                pageNumber++;
            }
        }

        return new ApplicationRunResult(totalCandidatesSeen);
    }

    private record ApplicationRunConfig(
        Integer daysBeforeDeletion,
        Boolean enabled,
        Boolean dryRun,
        Integer batchSize,
        Integer maxRuntimeMinutes,
        LocalDateTime cutoff
    ) {}

    private record ApplicationRunResult(long totalCandidatesSeen) {}
}
