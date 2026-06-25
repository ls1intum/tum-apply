package de.tum.cit.aet.core.security.oauth2;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.Cookie;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;

class HttpCookieOAuth2AuthorizationRequestRepositoryTest {

    private static final String COOKIE_NAME = "oauth2_auth_request";

    private final HttpCookieOAuth2AuthorizationRequestRepository repository = new HttpCookieOAuth2AuthorizationRequestRepository();

    private static OAuth2AuthorizationRequest sampleRequest() {
        return OAuth2AuthorizationRequest.authorizationCode()
            .authorizationUri("https://appleid.apple.com/auth/authorize")
            .clientId("services-id")
            .redirectUri("https://app.test/login/oauth2/code/apple")
            .scopes(Set.of("openid", "email", "name"))
            .state("state-123")
            .additionalParameters(Map.of("response_mode", "form_post"))
            .attributes(Map.of(OAuth2ParameterNames.REGISTRATION_ID, "apple"))
            .build();
    }

    @Test
    void savesAndLoadsAuthorizationRequestViaCookie() {
        OAuth2AuthorizationRequest original = sampleRequest();

        MockHttpServletResponse saveResponse = new MockHttpServletResponse();
        repository.saveAuthorizationRequest(original, new MockHttpServletRequest(), saveResponse);

        Cookie saved = saveResponse.getCookie(COOKIE_NAME);
        assertThat(saved).isNotNull();
        assertThat(saved.getValue()).isNotBlank();

        MockHttpServletRequest loadRequest = new MockHttpServletRequest();
        loadRequest.setCookies(new Cookie(COOKIE_NAME, saved.getValue()));
        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(loadRequest);

        assertThat(loaded).isNotNull();
        assertThat(loaded.getClientId()).isEqualTo("services-id");
        assertThat(loaded.getState()).isEqualTo("state-123");
        assertThat(loaded.getAuthorizationUri()).isEqualTo("https://appleid.apple.com/auth/authorize");
        assertThat(loaded.getAdditionalParameters()).containsEntry("response_mode", "form_post");
        assertThat(loaded.getAttributes()).containsEntry(OAuth2ParameterNames.REGISTRATION_ID, "apple");
    }

    @Test
    void removeReturnsRequestAndClearsCookie() {
        OAuth2AuthorizationRequest original = sampleRequest();
        MockHttpServletResponse saveResponse = new MockHttpServletResponse();
        repository.saveAuthorizationRequest(original, new MockHttpServletRequest(), saveResponse);
        String value = saveResponse.getCookie(COOKIE_NAME).getValue();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(COOKIE_NAME, value));
        MockHttpServletResponse removeResponse = new MockHttpServletResponse();

        OAuth2AuthorizationRequest removed = repository.removeAuthorizationRequest(request, removeResponse);

        assertThat(removed).isNotNull();
        assertThat(removeResponse.getCookie(COOKIE_NAME).getMaxAge()).isZero();
    }

    @Test
    void garbageCookieIsIgnored() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(COOKIE_NAME, "not-valid-base64-or-object"));

        assertThat(repository.loadAuthorizationRequest(request)).isNull();
    }
}
