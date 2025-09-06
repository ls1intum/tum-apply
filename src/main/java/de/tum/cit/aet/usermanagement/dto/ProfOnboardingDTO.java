package de.tum.cit.aet.usermanagement.dto;

/**
 * DTO for professor onboarding information.
 * Returned by the /api/me/prof-onboarding endpoint to indicate whether the onboarding dialog should be shown.
 *
 * @param show whether the onboarding dialog should be displayed
 */
public record ProfOnboardingDTO(
    boolean show
) {
}
