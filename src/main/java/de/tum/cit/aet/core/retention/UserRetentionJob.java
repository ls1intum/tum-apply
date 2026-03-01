package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.core.config.UserRetentionProperties;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRetentionJob {

    private static final int DAYS_BEFORE_DELETION_WARNING = 28;

    private final UserRetentionProperties properties;
    private final UserRepository userRepository;
    private final UserRetentionService userRetentionService;

    /**
     * Scheduled job that performs user retention cleanup based on configured settings.
     * <p>
     * If retention is disabled or no valid run configuration is available, the method exits early.
     * Otherwise, it builds a run configuration, processes candidate records within the maximum
     * runtime window, and logs a summary including dry-run status, cutoff timestamp, number of
     * candidates seen, actual runtime, and configured maximum runtime.
     */
    // Runs daily at 03:17 UTC (override with user.retention.cron)
    @Scheduled(cron = "${user.retention.cron:0 17 3 * * *}", zone = "UTC")
    public void deleteUserData() {
        if (!Boolean.TRUE.equals(properties.getEnabled())) {
            return;
        }

        RetentionRunConfig config = buildRunConfig();
        if (config == null) {
            return;
        }

        Instant start = Instant.now();
        Instant deadline = start.plus(Duration.ofMinutes(config.maxRuntimeMinutes()));

        RetentionRunResult result = processCandidates(config, deadline);

        Duration runtime = Duration.between(start, Instant.now());
        log.info(
            "User retention run finished: enabled=true dryRun={} cutoff={} candidatesSeen={} runtimeMs={} maxRuntimeMinutes={}",
            config.dryRun(),
            config.cutoff(),
            result.totalCandidatesSeen(),
            runtime.toMillis(),
            config.maxRuntimeMinutes()
        );
    }

    /**
     * Warns inactive non-admin users exactly 28 days before their deletion date.
     * <p>
     * Runs daily (configurable via {@code user.retention.cron}), computes the warning date as
     * {@code nowUtc - (inactiveDaysBeforeDeletion - 28)} and calls
     * {@link UserRetentionService#warnUserOfDataDeletion(LocalDateTime)}. Only the calendar date is compared
     * in the repository query, so the time component of {@code warningDate} is ignored.
     * Skips execution when {@code inactiveDaysBeforeDeletion} is not set or below the 28-day warning offset.
     * </p>
     */
    @Scheduled(cron = "${user.retention.cron:0 0 3 * * *}", zone = "UTC")
    public void warnUserOfDataDeletion() {
        Integer inactiveDays = properties.getInactiveDaysBeforeDeletion();
        if (inactiveDays == null || inactiveDays <= DAYS_BEFORE_DELETION_WARNING) {
            log.warn("User retention warning skipped: invalid inactiveDaysBeforeDeletion value={}", inactiveDays);
            return;
        }

        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime warningDate = nowUtc.minusDays(inactiveDays - DAYS_BEFORE_DELETION_WARNING);
        userRetentionService.warnUserOfDataDeletion(warningDate);
    }

    // ------------ Helper methods ------------

    private RetentionRunConfig buildRunConfig() {
        Integer inactiveDays = properties.getInactiveDaysBeforeDeletion();
        Integer batchSize = properties.getBatchSize();
        Integer maxRuntimeMinutes = properties.getMaxRuntimeMinutes();

        if (inactiveDays == null || inactiveDays <= 0) {
            log.warn("User retention enabled, but inactiveDaysBeforeDeletion is not configured (value={})", inactiveDays);
            return null;
        }
        if (batchSize == null || batchSize <= 0) {
            log.warn("User retention enabled, but batchSize is not configured (value={})", batchSize);
            return null;
        }
        if (maxRuntimeMinutes == null || maxRuntimeMinutes <= 0) {
            log.warn("User retention enabled, but maxRuntimeMinutes is not configured (value={})", maxRuntimeMinutes);
            return null;
        }

        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime cutoff = nowUtc.minusDays(inactiveDays);
        boolean dryRun = Boolean.TRUE.equals(properties.getDryRun());

        return new RetentionRunConfig(inactiveDays, batchSize, maxRuntimeMinutes, cutoff, dryRun);
    }

    private RetentionRunResult processCandidates(RetentionRunConfig config, Instant deadline) {
        long totalCandidatesSeen = 0;
        int pageNumber = 0;

        while (Instant.now().isBefore(deadline)) {
            PageRequest pageRequest = config.dryRun()
                ? PageRequest.of(pageNumber, config.batchSize())
                : PageRequest.of(0, config.batchSize());

            Page<UUID> userIds = userRepository.findInactiveNonAdminUserIdsForRetention(config.cutoff(), pageRequest);
            List<UUID> ids = userIds.getContent();

            if (ids.isEmpty()) {
                break;
            }

            totalCandidatesSeen += ids.size();

            userRetentionService.processUserIdsList(ids, config.cutoff(), config.dryRun());

            if (config.dryRun()) {
                if (!userIds.hasNext()) {
                    break;
                }
                pageNumber++;
            }
        }

        return new RetentionRunResult(totalCandidatesSeen);
    }

    private record RetentionRunConfig(
        Integer inactiveDays,
        Integer batchSize,
        Integer maxRuntimeMinutes,
        LocalDateTime cutoff,
        boolean dryRun
    ) {}

    private record RetentionRunResult(long totalCandidatesSeen) {}
}
