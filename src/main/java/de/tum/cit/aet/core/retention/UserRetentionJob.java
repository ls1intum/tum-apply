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

    private final UserRetentionProperties properties;
    private final UserRepository userRepository;
    private final UserRetentionService userRetentionService;

    // Runs daily at 03:17 UTC (override with user.retention.cron)
    @Scheduled(cron = "${user.retention.cron:0 17 3 * * *}", zone = "UTC")
    public void deleteUserData() {
        if (!Boolean.TRUE.equals(properties.getEnabled())) {
            return;
        }

        Integer inactiveDays = properties.getInactiveDaysBeforeDeletion();
        Integer batchSize = properties.getBatchSize();
        Integer maxRuntimeMinutes = properties.getMaxRuntimeMinutes();
        if (inactiveDays == null || inactiveDays <= 0) {
            log.warn("User retention enabled, but inactiveDaysBeforeDeletion is not configured (value={})", inactiveDays);
            return;
        }
        if (batchSize == null || batchSize <= 0) {
            log.warn("User retention enabled, but batchSize is not configured (value={})", batchSize);
            return;
        }
        if (maxRuntimeMinutes == null || maxRuntimeMinutes <= 0) {
            log.warn("User retention enabled, but maxRuntimeMinutes is not configured (value={})", maxRuntimeMinutes);
            return;
        }

        Instant start = Instant.now();
        Instant deadline = start.plus(Duration.ofMinutes(maxRuntimeMinutes));

        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime cutoff = nowUtc.minusDays(inactiveDays);

        boolean dryRun = Boolean.TRUE.equals(properties.getDryRun());

        long totalCandidatesSeen = 0;
        int pageNumber = 0;
        while (Instant.now().isBefore(deadline)) {
            PageRequest pageRequest = dryRun ? PageRequest.of(pageNumber, batchSize) : PageRequest.of(0, batchSize);
            Page<UUID> userIds = userRepository.findInactiveNonAdminUserIdsForRetention(cutoff, pageRequest);
            List<UUID> ids = userIds.getContent();

            if (ids.isEmpty()) {
                break;
            }

            totalCandidatesSeen += ids.size();

            userRetentionService.processUserIdsList(ids, cutoff, dryRun);

            if (dryRun) {
                if (!userIds.hasNext()) {
                    break;
                }
                pageNumber++;
            }
        }

        Duration runtime = Duration.between(start, Instant.now());
        log.info(
            "User retention run finished: enabled=true dryRun={} cutoff={} candidatesSeen={} runtimeMs={} maxRuntimeMinutes={}",
            dryRun,
            cutoff,
            totalCandidatesSeen,
            runtime.toMillis(),
            maxRuntimeMinutes
        );
    }
}
