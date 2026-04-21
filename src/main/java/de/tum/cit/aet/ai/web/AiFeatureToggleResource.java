package de.tum.cit.aet.ai.web;

import de.tum.cit.aet.ai.dto.AiFeatureStatusDTO;
import de.tum.cit.aet.ai.service.AiFeatureToggleService;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the AI feature toggle (Fehlerstrategie).
 * Provides endpoints for checking AI availability and for admins to toggle AI features.
 */
@RestController
@RequestMapping("api/ai/feature-toggle")
@Slf4j
@Profile("!openapi")
public class AiFeatureToggleResource {

    private final AiFeatureToggleService aiFeatureToggleService;

    public AiFeatureToggleResource(AiFeatureToggleService aiFeatureToggleService) {
        this.aiFeatureToggleService = aiFeatureToggleService;
    }

    /**
     * Returns the current system-wide AI feature status.
     * Available to any authenticated user so the frontend can adapt the UI.
     */
    @Authenticated
    @GetMapping("/status")
    public ResponseEntity<AiFeatureStatusDTO> getAiStatus() {
        return ResponseEntity.ok(aiFeatureToggleService.getStatus());
    }

    /**
     * Manually enable or disable AI features system-wide. Admin only.
     *
     * @param enabled whether AI features should be enabled
     */
    @Admin
    @PutMapping("/toggle")
    public ResponseEntity<AiFeatureStatusDTO> toggleAi(@RequestParam boolean enabled) {
        log.info("PUT /api/ai/feature-toggle/toggle - Admin toggling AI features to {}", enabled);
        aiFeatureToggleService.setEnabled(enabled);
        return ResponseEntity.ok(aiFeatureToggleService.getStatus());
    }

    /**
     * Manually reset the circuit breaker. Admin only.
     * Use this after fixing the underlying issue (e.g. rotating an expired API key).
     */
    @Admin
    @PostMapping("/reset-circuit-breaker")
    public ResponseEntity<AiFeatureStatusDTO> resetCircuitBreaker() {
        log.info("POST /api/ai/feature-toggle/reset-circuit-breaker - Admin resetting circuit breaker");
        aiFeatureToggleService.resetCircuitBreaker();
        return ResponseEntity.ok(aiFeatureToggleService.getStatus());
    }
}
