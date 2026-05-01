package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.domain.SystemSetting;
import de.tum.cit.aet.ai.dto.AiFeatureStatusDTO;
import de.tum.cit.aet.ai.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

/**
 * Manages the system-wide AI feature toggle (Fehlerstrategie).
 *
 * Provides two independent mechanisms for disabling AI:
 * <ul>
 *   <li><b>Manual toggle</b> — an admin can explicitly enable/disable AI features.
 *       The state is persisted in the {@code system_settings} table so it survives restarts.</li>
 *   <li><b>Circuit breaker</b> — after {@value #FAILURE_THRESHOLD} consecutive LLM failures
 *       the circuit transitions to {@link CircuitState#OPEN}. After {@value #COOLDOWN_SECONDS}
 *       seconds it transitions to {@link CircuitState#HALF_OPEN}, letting exactly one probe
 *       request through. A successful probe closes the circuit; a failed probe re-opens it
 *       and restarts the cooldown.</li>
 * </ul>
 *
 * AI is available only when both conditions are met: manually enabled AND circuit closed.
 */
@Service
public class AiFeatureToggleService {

    private static final String SETTING_KEY = "ai.enabled";
    private static final int FAILURE_THRESHOLD = 5;
    private static final long COOLDOWN_SECONDS = 300;

    private enum CircuitState {
        CLOSED,
        OPEN,
        HALF_OPEN,
    }

    private final SystemSettingRepository systemSettingRepository;

    private volatile boolean manuallyEnabled = true;

    private final Object circuitLock = new Object();
    private CircuitState circuitState = CircuitState.CLOSED;
    private int consecutiveFailures = 0;
    private long openedAt = 0;

    public AiFeatureToggleService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @PostConstruct
    void init() {
        try {
            systemSettingRepository.findById(SETTING_KEY).ifPresent(setting -> manuallyEnabled = Boolean.parseBoolean(setting.getValue()));
        } catch (Exception e) {
            // Table may not exist during API docs generation (no-liquibase profile); default to enabled
        }
    }

    /**
     * Returns {@code true} when AI features are available system-wide.
     * This requires both the manual toggle to be ON and the circuit breaker to permit the request.
     *
     * <p>If the circuit breaker is {@link CircuitState#OPEN} and the cooldown has elapsed,
     * the first caller transitions it to {@link CircuitState#HALF_OPEN} and is allowed through
     * as the probe; concurrent callers see the breaker as closed for that single probe only.
     *
     * @return {@code true} if AI features are currently available
     */
    public boolean isAiAvailable() {
        return manuallyEnabled && !isCircuitBreakerOpen();
    }

    /**
     * Returns {@code true} when the circuit breaker is currently rejecting requests.
     * After the cooldown elapses, the first call transitions {@link CircuitState#OPEN}
     * to {@link CircuitState#HALF_OPEN} and returns {@code false} so that caller can probe.
     * Subsequent callers see {@code true} until the probe resolves via
     * {@link #recordSuccess()} or {@link #recordFailure()}.
     *
     * @return {@code true} if the circuit breaker is currently open
     */
    public boolean isCircuitBreakerOpen() {
        synchronized (circuitLock) {
            if (circuitState == CircuitState.CLOSED) {
                return false;
            }
            if (circuitState == CircuitState.OPEN && System.currentTimeMillis() - openedAt > COOLDOWN_SECONDS * 1000) {
                circuitState = CircuitState.HALF_OPEN;
                return false;
            }
            return true;
        }
    }

    /**
     * Manually enable or disable AI features system-wide. Persisted to the database.
     *
     * @param enabled whether AI features should be enabled
     */
    public void setEnabled(boolean enabled) {
        manuallyEnabled = enabled;
        systemSettingRepository.save(new SystemSetting(SETTING_KEY, String.valueOf(enabled)));
    }

    /**
     * Record a successful LLM call. Closes the circuit breaker and resets failure count.
     */
    public void recordSuccess() {
        resetCircuitBreaker();
    }

    /**
     * Record a failed LLM call. Opens the circuit breaker after
     * {@value #FAILURE_THRESHOLD} consecutive failures, or immediately if a half-open probe fails.
     */
    public void recordFailure() {
        synchronized (circuitLock) {
            if (
                circuitState == CircuitState.HALF_OPEN ||
                (circuitState == CircuitState.CLOSED && ++consecutiveFailures >= FAILURE_THRESHOLD)
            ) {
                circuitState = CircuitState.OPEN;
                openedAt = System.currentTimeMillis();
            }
        }
    }

    /**
     * Resets the circuit breaker to closed state. Used both after a successful LLM probe
     * and as a manual admin action.
     */
    public void resetCircuitBreaker() {
        synchronized (circuitLock) {
            consecutiveFailures = 0;
            circuitState = CircuitState.CLOSED;
            openedAt = 0;
        }
    }

    /**
     * Returns a snapshot of the current AI feature status.
     *
     * @return the current AI feature status including manual toggle and circuit breaker state
     */
    public AiFeatureStatusDTO getStatus() {
        boolean breakerOpen;
        synchronized (circuitLock) {
            breakerOpen = circuitState != CircuitState.CLOSED;
        }
        return new AiFeatureStatusDTO(manuallyEnabled && !breakerOpen, !manuallyEnabled, breakerOpen);
    }
}
