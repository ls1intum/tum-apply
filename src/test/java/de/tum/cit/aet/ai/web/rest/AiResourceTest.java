package de.tum.cit.aet.ai.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.service.AiService;
import de.tum.cit.aet.ai.web.AiResource;
import de.tum.cit.aet.utility.MvcTestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.util.ReflectionTestUtils;

class AiResourceTest extends AbstractResourceTest {

    @Autowired
    private MvcTestClient api;

    @Autowired
    private AiResource aiResource;

    private AiService aiService;

    private final String TRANSLATE_URL = "/api/ai/translateJobDescriptionForJob";

    private final String input = "Hello World";

    @BeforeEach
    void setUp() {
        aiService = Mockito.mock(AiService.class);
        ReflectionTestUtils.setField(aiResource, "aiService", aiService);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void translateJobDescriptionReturnsTranslatedText() {
        String mockTranslation = "Hallo Welt";
        String jobId = "job-1";
        String toLang = "de";

        given(aiService.translateAndPersistJobDescription(anyString(), anyString(), anyString())).willReturn(
            new AIJobDescriptionTranslationDTO(mockTranslation)
        );

        String url = TRANSLATE_URL + "?jobId=" + jobId + "&toLang=" + toLang;
        AIJobDescriptionTranslationDTO response = api.putAndRead(url, input, AIJobDescriptionTranslationDTO.class, 200);

        assertThat(response).isNotNull();
        assertThat(response.translatedText()).isEqualTo(mockTranslation);
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void translateJobDescriptionAsStudentForbidden() {
        String url = TRANSLATE_URL + "?jobId=job-1&toLang=de";
        api.putAndRead(url, input, Void.class, 403);
    }

    @Test
    void translateJobDescriptionWithoutAuthReturnsForbidden() {
        String url = TRANSLATE_URL + "?jobId=job-1&toLang=de";
        api.putAndRead(url, input, Void.class, 401);
    }
}
