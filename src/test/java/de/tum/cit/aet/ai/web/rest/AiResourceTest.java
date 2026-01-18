package de.tum.cit.aet.ai.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.exception.AiResponseException;
import de.tum.cit.aet.ai.service.AiService;
import de.tum.cit.aet.utility.MvcTestClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

class AiResourceTest extends AbstractResourceTest {

    @Autowired
    private MvcTestClient api;

    @MockitoBean
    private AiService aiService;

    private final String TRANSLATE_URL = "/api/ai/translateJobDescription";

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void translateJobDescriptionReturnsTranslatedText() {
        String input = "Hello World";
        String mockTranslation = "Hallo Welt";

        given(aiService.translateText(anyString())).willReturn(new AIJobDescriptionTranslationDTO(mockTranslation));

        AIJobDescriptionTranslationDTO response = api.putAndRead(TRANSLATE_URL, input, AIJobDescriptionTranslationDTO.class, 200);

        assertThat(response).isNotNull();
        assertThat(response.translatedText()).isEqualTo(mockTranslation);
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void translateJobDescriptionAsStudentForbidden() {
        String input = "Hello World";
        api.putAndRead(TRANSLATE_URL, input, Void.class, 403);
    }

    @Test
    void translateJobDescriptionWithoutAuthReturnsForbidden() {
        String input = "Hello World";
        api.putAndRead(TRANSLATE_URL, input, Void.class, 401);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void translateJobDescriptionThrowsException() {
        given(aiService.translateText(anyString())).willThrow(new AiResponseException(new RuntimeException()));

        api.putAndRead("/api/ai/translateJobDescription", "Some text", Void.class, 500);
    }
}
