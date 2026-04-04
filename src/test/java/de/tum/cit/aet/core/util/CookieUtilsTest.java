package de.tum.cit.aet.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

class CookieUtilsTest {

    @Test
    void shouldSetBothCookiesWithStrictSameSite() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthResponseDTO tokens = new AuthResponseDTO("access-tok", "refresh-tok", 300, 1800);

        CookieUtils.setAuthCookies(response, tokens);

        List<String> setCookieHeaders = response.getHeaders("Set-Cookie");
        assertThat(setCookieHeaders).hasSize(2);

        String accessCookie = setCookieHeaders
            .stream()
            .filter(h -> h.startsWith("access_token="))
            .findFirst()
            .orElseThrow();
        String refreshCookie = setCookieHeaders
            .stream()
            .filter(h -> h.startsWith("refresh_token="))
            .findFirst()
            .orElseThrow();

        // Both cookies must use SameSite=Strict to prevent cross-site request attachment
        assertThat(accessCookie).contains("SameSite=Strict");
        assertThat(refreshCookie).contains("SameSite=Strict");

        // Both must be HttpOnly and Secure
        assertThat(accessCookie).contains("HttpOnly");
        assertThat(accessCookie).contains("Secure");
        assertThat(refreshCookie).contains("HttpOnly");
        assertThat(refreshCookie).contains("Secure");

        // Verify token values are set
        assertThat(accessCookie).contains("access_token=access-tok");
        assertThat(refreshCookie).contains("refresh_token=refresh-tok");

        // Verify max-age values
        assertThat(accessCookie).contains("Max-Age=300");
        assertThat(refreshCookie).contains("Max-Age=1800");
    }

    @Test
    void shouldClearBothCookiesWithStrictSameSite() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        CookieUtils.setAuthCookies(response, null);

        List<String> setCookieHeaders = response.getHeaders("Set-Cookie");
        assertThat(setCookieHeaders).hasSize(2);

        String clearAccess = setCookieHeaders
            .stream()
            .filter(h -> h.startsWith("access_token="))
            .findFirst()
            .orElseThrow();
        String clearRefresh = setCookieHeaders
            .stream()
            .filter(h -> h.startsWith("refresh_token="))
            .findFirst()
            .orElseThrow();

        // Even when clearing, SameSite=Strict must be set
        assertThat(clearAccess).contains("SameSite=Strict");
        assertThat(clearRefresh).contains("SameSite=Strict");

        // Max-Age=0 means clear
        assertThat(clearAccess).contains("Max-Age=0");
        assertThat(clearRefresh).contains("Max-Age=0");
    }

    @Test
    void shouldNeverUseSameSiteLax() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthResponseDTO tokens = new AuthResponseDTO("a", "r", 300, 1800);

        CookieUtils.setAuthCookies(response, tokens);

        List<String> setCookieHeaders = response.getHeaders("Set-Cookie");
        for (String header : setCookieHeaders) {
            assertThat(header).doesNotContain("SameSite=Lax");
        }
    }
}
