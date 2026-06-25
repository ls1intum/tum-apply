package de.tum.cit.aet.core.config;

import de.tum.cit.aet.core.security.oauth2.OAuth2LoginSuccessHandler;
import de.tum.cit.aet.core.service.AppTokenService;
import de.tum.cit.aet.usermanagement.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

/**
 * Security chain that lets TUMApply perform Google/Apple sign-in directly (replacing Keycloak IdP
 * brokering for the decommissioned external-login realm). It is a separate, higher-priority filter chain
 * matching only the OAuth2 endpoints, so the stateless resource-server chain ({@code /api/**}) is untouched.
 * <p>
 * Activated only under the {@code social-login} profile: this keeps the {@code ClientRegistrationRepository}
 * auto-configuration (and this chain) out of dev/test/CI, where no OAuth2 client credentials are configured.
 * Enable in deployments via {@code SPRING_PROFILES_ACTIVE=...,social-login} together with the provider
 * client credentials.
 */
@Configuration
@Profile("social-login")
public class OAuth2LoginSecurityConfiguration {

    /**
     * Success handler that turns a completed Google/Apple sign-in into an app-issued cookie session.
     *
     * @param userService     provisions the local user from the verified provider identity
     * @param appTokenService mints the app access/refresh tokens
     * @param clientUrl       SPA base URL to redirect back to after login
     * @return the configured success handler
     */
    @Bean
    public OAuth2LoginSuccessHandler oauth2LoginSuccessHandler(
        UserService userService,
        AppTokenService appTokenService,
        @Value("${aet.client.url}") String clientUrl
    ) {
        return new OAuth2LoginSuccessHandler(userService, appTokenService, clientUrl);
    }

    /**
     * Higher-priority filter chain that handles only the OAuth2 login endpoints via redirect-based
     * {@code oauth2Login}, leaving the stateless resource-server chain to serve {@code /api/**}.
     *
     * @param http                       the HTTP security builder
     * @param oauth2LoginSuccessHandler  handler that issues the app session on success
     * @param clientUrl                  SPA base URL used to build the failure redirect
     * @return the OAuth2 login security filter chain
     * @throws Exception if the chain cannot be built
     */
    @Bean
    @Order(1)
    public SecurityFilterChain oauth2LoginFilterChain(
        HttpSecurity http,
        OAuth2LoginSuccessHandler oauth2LoginSuccessHandler,
        @Value("${aet.client.url}") String clientUrl
    ) throws Exception {
        String redirectBase = clientUrl.endsWith("/") ? clientUrl.substring(0, clientUrl.length() - 1) : clientUrl;
        AuthenticationFailureHandler failureHandler = (request, response, exception) ->
            response.sendRedirect(redirectBase + "/?login_error=oauth");

        http
            // Only the redirect-based OAuth2 endpoints; the resource-server chain handles everything else.
            .securityMatcher("/oauth2/**", "/login/oauth2/**")
            // OAuth2 login relies on the `state` parameter for CSRF protection on these endpoints.
            .csrf(CsrfConfigurer::disable)
            .authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
            .oauth2Login(oauth -> oauth.successHandler(oauth2LoginSuccessHandler).failureHandler(failureHandler));
        return http.build();
    }
}
