package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.domain.SystemSetting;
import de.tum.cit.aet.ai.dto.AiFeatureStatusDTO;
import de.tum.cit.aet.ai.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Manages the system-wide AI feature toggle (Fehlerstrategie).
 *
 * Provides two independent mechanisms for disabling AI:
 * <ul>
 *   <li><b>Manual toggle</b> — an admin can explicitly enable/disable AI features.
 *       The state is persisted in the {@code system_settings} table so it survives restarts.</li>
 *   <li><b>Circuit breaker</b> — after {@value #FAILURE_THRESHOLD} consecutive LLM failures
 *       the circuit opens automatically. It enters a half-open state after
 *       {@value #COOLDOWN_SECONDS} seconds, allowing a single probe request. A successful
 *       probe closes the circuit; a failed probe re-opens it.</li>
 * </ul>
 *
 * AI is available only when both conditions are met: manually enabled AND circuit closed.
 */
@Service
@Slf4j
public class AiFeatureToggleService {

    private static final String SETTING_KEY = "ai.enabled";
    private static final int FAILURE_THRESHOLD = 5;
    private static final long COOLDOWN_SECONDS = 60;

    private final SystemSettingRepository systemSettingRepository;

    private final AtomicBoolean manuallyEnabled = new AtomicBoolean(true);
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private final AtomicLong circuitOpenedAt = new AtomicLong(0);

    public AiFeatureToggleService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @PostConstruct
    void init() {
        systemSettingRepository.findById(SETTING_KEY).ifPresent(setting -> manuallyEnabled.set(Boolean.parseBoolean(setting.getValue())));
        log.info("AI feature toggle initialized: manuallyEnabled={}", manuallyEnabled.get());
    }

    /**
     * Returns {@code true} when AI features are available system-wide.
     * This requires both the manual toggle to be ON and the circuit breaker to be CLOSED.
     *
     * @return {@code true} if AI features are currently available
     */
    public boolean isAiAvailable() {
        return manuallyEnabled.get() && !isCircuitBreakerOpen();
    }

    /**
     * Returns {@code true} when AI features are manually enabled by an admin.
     *
     * @return {@code true} if the manual toggle is ON
     */
    public boolean isManuallyEnabled() {
        return manuallyEnabled.get();
    }

    /**
     * Returns {@code true} when the circuit breaker is open (too many consecutive LLM failures).
     * After the cooldown period the circuit enters half-open state (returns {@code false})
     * to allow a probe request.
     *
     * @return {@code true} if the circuit breaker is currently open
     */
    public boolean isCircuitBreakerOpen() {
        long openedAt = circuitOpenedAt.get();
        if (openedAt == 0) {
            return false;
        }
        if (System.currentTimeMillis() - openedAt > COOLDOWN_SECONDS * 1000) {
            return false; // half-open: allow a probe
        }
        return true;
    }

    /**
     * Manually enable or disable AI features system-wide. Persisted to the database.
     *
     * @param enabled whether AI features should be enabled
     */
    public void setEnabled(boolean enabled) {
        manuallyEnabled.set(enabled);
        systemSettingRepository.save(new SystemSetting(SETTING_KEY, String.valueOf(enabled)));
        log.info("AI features manually {}", enabled ? "enabled" : "disabled");
    }

    /**
     * Record a successful LLM call. Resets the circuit breaker.
     */
    public void recordSuccess() {
        if (consecutiveFailures.get() > 0 || circuitOpenedAt.get() > 0) {
            log.info("AI circuit breaker reset after successful call (was at {} consecutive failures)", consecutiveFailures.get());
        }
        consecutiveFailures.set(0);
        circuitOpenedAt.set(0);
    }

    /**
     * Record a failed LLM call. Opens the circuit breaker after {@value #FAILURE_THRESHOLD} consecutive failures.
     */
    public void recordFailure() {
        int failures = consecutiveFailures.incrementAndGet();
        if (failures >= FAILURE_THRESHOLD && circuitOpenedAt.compareAndSet(0, System.currentTimeMillis())) {
            log.warn("AI circuit breaker OPENED after {} consecutive failures", failures);
        }
    }

    /**
     * Manually reset the circuit breaker (admin action).
     */
    public void resetCircuitBreaker() {
        consecutiveFailures.set(0);
        circuitOpenedAt.set(0);
        log.info("AI circuit breaker manually reset by admin");
    }

    /**
     * Returns a snapshot of the current AI feature status.
     *
     * @return the current AI feature status including manual toggle and circuit breaker state
     */
    public AiFeatureStatusDTO getStatus() {
        return new AiFeatureStatusDTO(isAiAvailable(), !manuallyEnabled.get(), isCircuitBreakerOpen());
    }
}
