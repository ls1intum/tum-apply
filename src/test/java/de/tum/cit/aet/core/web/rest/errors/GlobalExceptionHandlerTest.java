package de.tum.cit.aet.core.web.rest.errors;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.tum.cit.aet.core.exception.handler.GlobalExceptionHandler;
import de.tum.cit.aet.core.service.AuthenticationService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = TestExceptionController.class)
@Import({ GlobalExceptionHandler.class, GlobalExceptionHandlerTest.TestConfig.class })
@AutoConfigureMockMvc(addFilters = false)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsNotFoundWithErrorCode() throws Exception {
        mockMvc
            .perform(get("/test/not-found"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.errorCode").value("ENTITY_NOT_FOUND"))
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.message").value("User with Ids '[42]' does not exist"));
    }

    @Test
    void returnsInternalErrorForUnhandledExceptions() throws Exception {
        mockMvc
            .perform(get("/test/bad-request"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
            .andExpect(jsonPath("$.status").value(500))
            .andExpect(jsonPath("$.message").value("Something went wrong"));
    }

    @Test
    void returnsInvalidParameterException() throws Exception {
        mockMvc
            .perform(get("/test/invalid-param"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("INVALID_PARAMETER"))
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message").value("Invalid parameter provided"));
    }

    @Test
    void returnsResourceAlreadyExistsException() throws Exception {
        mockMvc
            .perform(get("/test/already-exists"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.errorCode").value("RESOURCE_ALREADY_EXISTS"))
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.message").value("Resource already exists"));
    }

    @Test
    void returnsUnauthorizedException() throws Exception {
        mockMvc
            .perform(get("/test/unauthorized"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.message").value("Unauthorized access"));
    }

    @Test
    void returnsAccessDeniedException() throws Exception {
        mockMvc
            .perform(get("/test/forbidden"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"))
            .andExpect(jsonPath("$.status").value(403))
            .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void returnsOperationNotAllowedException() throws Exception {
        mockMvc
            .perform(get("/test/not-allowed"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("OPERATION_NOT_ALLOWED"))
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message").value("Operation not allowed"));
    }

    @Test
    void returnsUploadException() throws Exception {
        mockMvc
            .perform(get("/test/upload"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("UPLOAD_FAILED"))
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message").value("Upload failed"));
    }

    @Test
    void returnsMailingException() throws Exception {
        mockMvc
            .perform(get("/test/mailing"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.errorCode").value("MAILING_ERROR"))
            .andExpect(jsonPath("$.status").value(500))
            .andExpect(jsonPath("$.message").value("Mailing failed"));
    }

    @Test
    void returnsInternalServerException() throws Exception {
        mockMvc
            .perform(get("/test/internal-error"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
            .andExpect(jsonPath("$.status").value(500))
            .andExpect(jsonPath("$.message").value("Internal server error"));
    }

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

    @TestConfiguration
    static class TestConfig {

        @Bean
        public AuthenticationService authenticationService() {
            return Mockito.mock(AuthenticationService.class);
        }
    }
}
