package de.tum.cit.aet.core.web.rest.errors;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.tum.cit.aet.core.exception.handler.GlobalExceptionHandler;
import de.tum.cit.aet.core.service.AuthenticationService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientAutoConfiguration;
import org.springframework.boot.security.oauth2.client.autoconfigure.servlet.OAuth2ClientWebSecurityAutoConfiguration;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = TestExceptionController.class,
    excludeAutoConfiguration = {
        OAuth2ResourceServerAutoConfiguration.class, OAuth2ClientAutoConfiguration.class, OAuth2ClientWebSecurityAutoConfiguration.class,
    }
)
@Import({ GlobalExceptionHandler.class, GlobalExceptionHandlerTest.TestConfig.class })
@AutoConfigureMockMvc(addFilters = false)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    // ===== EXCEPTION TO ERROR RESPONSE MAPPING =====
    @Nested
    class ExceptionToErrorResponseMappingTests {

        @ParameterizedTest(name = "GET {0} should return {1} with errorCode {2}")
        @CsvSource(
            {
                "/test/not-found,        404, ENTITY_NOT_FOUND,         User with Ids '[42]' does not exist",
                "/test/bad-request,      500, INTERNAL_ERROR,           Something went wrong",
                "/test/invalid-param,    400, INVALID_PARAMETER,        Invalid parameter provided",
                "/test/already-exists,   409, RESOURCE_ALREADY_EXISTS,  Resource already exists",
                "/test/unauthorized,     401, UNAUTHORIZED,             Unauthorized access",
                "/test/forbidden,        403, ACCESS_DENIED,            Access denied",
                "/test/not-allowed,      400, OPERATION_NOT_ALLOWED,    Operation not allowed",
                "/test/upload,           400, UPLOAD_FAILED,            Upload failed",
                "/test/mailing,          500, MAILING_ERROR,            Mailing failed",
                "/test/internal-error,   500, INTERNAL_ERROR,           Internal server error",
            }
        )
        void shouldMapExceptionToExpectedErrorResponse(String path, int expectedStatus, String expectedErrorCode, String expectedMessage)
            throws Exception {
            mockMvc
                .perform(get(path))
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.errorCode").value(expectedErrorCode))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.message").value(expectedMessage));
        }
    }

    // ===== VALIDATION ERROR HANDLING =====
    @Nested
    class ValidationErrorHandlingTests {

        @Test
        void returnsValidationError() throws Exception {
            mockMvc
                .perform(
                    post("/test/validation-error")
                        .contentType("application/json")
                        .content(
                            """
                            {
                              "name": ""
                            }
                            """
                        )
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("name"))
                .andExpect(jsonPath("$.fieldErrors[0].message").value("name must not be blank"));
        }

        @Test
        void returnsConstraintViolationExceptionAsValidationError() throws Exception {
            mockMvc
                .perform(get("/test/constraint-violation").param("param", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray())
                .andExpect(jsonPath("$.fieldErrors[0].field").value(org.hamcrest.Matchers.containsString("param")))
                .andExpect(jsonPath("$.fieldErrors[0].message").value("must not be blank"));
        }

        @Test
        void returnsMissingServletRequestParameterException() throws Exception {
            mockMvc
                .perform(get("/test/constraint-violation"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("param"))
                .andExpect(jsonPath("$.fieldErrors[0].message").value("Required parameter 'param' is missing"));
        }
    }

    // ===== REQUEST FORMAT ERROR HANDLING =====
    @Nested
    class RequestFormatErrorHandlingTests {

        @Test
        void returnsMethodNotAllowed() throws Exception {
            mockMvc
                .perform(post("/test/not-found")) // only GET allowed
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.errorCode").value("INVALID_PARAMETER"))
                .andExpect(jsonPath("$.status").value(405));
        }

        @Test
        void returnsUnsupportedMediaType() throws Exception {
            mockMvc
                .perform(post("/test/validation-error").contentType("text/plain").content("name=abc"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.errorCode").value("INVALID_PARAMETER"))
                .andExpect(jsonPath("$.status").value(415));
        }

        @Test
        void returnsBadRequestForUnreadableJson() throws Exception {
            mockMvc
                .perform(post("/test/validation-error").contentType("application/json").content("{ name: }")) // malformed JSON
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_PARAMETER"))
                .andExpect(jsonPath("$.status").value(400));
        }

        @Test
        void returnsTypeMismatchException() throws Exception {
            mockMvc
                .perform(get("/test/type-mismatch").param("number", "not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_PARAMETER"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("number"));
        }
    }

    @TestConfiguration
    static class TestConfig {

        @Bean
        public AuthenticationService authenticationService() {
            return Mockito.mock(AuthenticationService.class);
        }
    }
}
