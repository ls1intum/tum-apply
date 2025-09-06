package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.dto.ProfOnboardingDTO;
import de.tum.cit.aet.usermanagement.service.UserSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST resource for professor onboarding flow.
 * Provides endpoints to check if the onboarding dialog should be displayed
 * and to update the onboarding state based on user actions.
 */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class ProfOnboardingResource {

    private static final String ONBOARDED = "onboarded";

    private final UserSettingService userSettingService;
    private final CurrentUserService currentUserService;

    /**
     * Check whether the onboarding dialog should be shown for the current user.
     *
     * @return ProfOnboardingDTO containing the show flag
     */
    @GetMapping("/prof-onboarding")
    public ProfOnboardingDTO check() {
        boolean hasProfessorRights = currentUserService.isProfessor();
        if (hasProfessorRights) {
            return new ProfOnboardingDTO(false);
        }
        UUID userId = currentUserService.getUserId();
        boolean onboarded = userSettingService.getBool(userId, ONBOARDED);
        return new ProfOnboardingDTO(!onboarded);
    }

    /**
     * Mark the current user as onboarded (either applicant confirmed or professor email sent).
     */
    @PostMapping("/prof-onboarding/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmOnboarding() {
        UUID userId = currentUserService.getUserId();
        userSettingService.setBool(userId, ONBOARDED, true);
    }

    /**
     * Mark the current user as not yet onboarded (remind later).
     */
    @PostMapping("/prof-onboarding/remind")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remindLater() {
        UUID userId = currentUserService.getUserId();
        userSettingService.setBool(userId, ONBOARDED, false);
    }
}
