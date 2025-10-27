package de.tum.cit.aet.core.config;

import de.tum.cit.aet.core.security.CustomJwtAuthenticationConverter;
import de.tum.cit.aet.core.security.SpaWebFilter;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import jakarta.servlet.http.Cookie;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.util.WebUtils;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfiguration {

    private final CustomJwtAuthenticationConverter customJwtAuthenticationConverter;
    private final CorsFilter corsFilter;
    private final KeycloakAuthenticationService keycloakAuthenticationService;

    public SecurityConfiguration(
        CustomJwtAuthenticationConverter customJwtAuthenticationConverter,
        CorsFilter corsFilter,
        KeycloakAuthenticationService keycloakAuthenticationService
    ) {
        this.customJwtAuthenticationConverter = customJwtAuthenticationConverter;
        this.corsFilter = corsFilter;
        this.keycloakAuthenticationService = keycloakAuthenticationService;
    }

    /**
     * Spring Security configuration.
     *
     * @param http the {@link HttpSecurity} to modify
     * @return the {@link SecurityFilterChain}
     * @throws Exception if an error occurs
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disables CSRF (Cross-Site Request Forgery) protection; useful in stateless
            // APIs where the token management is unnecessary.
            .csrf(CsrfConfigurer::disable)
            // Adds a CORS (Cross-Origin Resource Sharing) filter before the
            // username/password authentication to handle cross-origin requests.
            .addFilterBefore(corsFilter, UsernamePasswordAuthenticationFilter.class)
            // Adds a custom filter for Single Page Applications (SPA), i.e. the client,
            // after the basic authentication filter.
            .addFilterAfter(new SpaWebFilter(), BasicAuthenticationFilter.class)
            // Configures security headers.
            .headers(headers ->
                headers
                    // Sets Content Security Policy (CSP) directives to prevent XSS attacks.
                    .contentSecurityPolicy(csp -> csp.policyDirectives("script-src 'self' 'unsafe-inline' 'unsafe-eval'"))
                    // Prevents the website from being framed, avoiding clickjacking attacks.
                    .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable) // Sets Referrer Policy to limit
                    // the amount of referrer
                    // information sent with requests.
                    .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                    // Disables HTTP Strict Transport Security as it is managed at the reverse proxy
                    // level (typically nginx).
                    .httpStrictTransportSecurity((HeadersConfigurer.HstsConfig::disable))
                    // Defines Permissions Policy to restrict what features the browser is allowed
                    // to use.
                    .permissionsPolicyHeader(permissions ->
                        permissions.policy(
                            "camera=(), fullscreen=(*), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), sync-xhr=()"
                        )
                    )
            )
            // Configures sessions to be stateless; appropriate for REST APIs where no
            // session is required.
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Configures authorization for various URL patterns. The patterns are
            // considered in order.
            .authorizeHttpRequests(requests ->
                requests
                    // NOTE: Always have a look at {@link
                    // de.tum.cit.aet.artemis.core.security.filter.SpaWebFilter} to see which URLs
                    // are forwarded to the SPA
                    // Client related URLs and publicly accessible information (allowed for
                    // everyone).
                    .requestMatchers("/", "/index.html", "/public/**")
                    .permitAll()
                    .requestMatchers("/*.js", "/*.css", "/*.map", "/*.json")
                    .permitAll()
                    .requestMatchers("/manifest.webapp", "/robots.txt")
                    .permitAll()
                    .requestMatchers("/assets/**")
                    .permitAll()
                    .requestMatchers("/content/**", "/i18n/*.json", "/logo/*")
                    .permitAll()
                    .requestMatchers("/media/**")
                    .permitAll()
                    .requestMatchers("/favicon.ico")
                    .permitAll()
                    // Information and health endpoints do not need authentication
                    .requestMatchers("/management/info", "/management/health")
                    .permitAll()
                    // Admin area requires specific authority.
                    .requestMatchers("/api/*/admin/**")
                    .hasRole("ADMIN")
                    // Publicly accessible API endpoints (allowed for everyone).
                    .requestMatchers("/api/*/public/**")
                    .permitAll()
                    .requestMatchers("/api/public/config")
                    .permitAll()
                    .requestMatchers("/api/jobs/available", "/api/jobs/filters", "/api/jobs/available/**", "/api/jobs/detail/**")
                    .permitAll()
                    .requestMatchers("/api/auth/login")
                    .permitAll()
                    .requestMatchers("/api/auth/send-code")
                    .permitAll()
                    .requestMatchers("/api/auth/otp-complete")
                    .permitAll()
                    .requestMatchers("/api/auth/logout")
                    .permitAll()
                    .requestMatchers("/api/**")
                    .authenticated()
                    .requestMatchers("/login/webauthn")
                    .permitAll()
                    // Websocket and other specific endpoints allowed without authentication.
                    .requestMatchers("/websocket/**")
                    .permitAll()
                    .requestMatchers("/.well-known/jwks.json")
                    .permitAll()
                    .requestMatchers("/.well-known/assetlinks.json")
                    .permitAll()
                    // Prometheus endpoint protected by IP address.
                    .requestMatchers("/management/prometheus/**")
                    .permitAll()
                    .requestMatchers(("/api-docs"))
                    .permitAll()
                    .requestMatchers(("/api-docs.yaml"))
                    .permitAll()
                    .requestMatchers("/swagger-ui/**")
                    .permitAll()
            )
            .oauth2ResourceServer(oauth2 ->
                oauth2
                    .bearerTokenResolver(bearerTokenResolver())
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter))
            );
        return http.build();
    }

    /**
     * Extracts the bearer token from the 'access_token' cookie, falling back to the Authorization header.
     *
     * @return a BearerTokenResolver that reads from cookie and refreshes tokens as needed
     */
    private BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();
        return request -> {
            Cookie accessCookie = WebUtils.getCookie(request, "access_token");
            Cookie refreshCookie = WebUtils.getCookie(request, "refresh_token");
            if (accessCookie != null && accessCookie.getValue() != null) {
                return accessCookie.getValue();
            } else if ((accessCookie == null || accessCookie.getValue() == null) && refreshCookie != null) {
                AuthResponseDTO tokens = keycloakAuthenticationService.refreshTokens(null, refreshCookie.getValue());
                return tokens.accessToken();
            }
            return defaultResolver.resolve(request);
        };
    }
}
