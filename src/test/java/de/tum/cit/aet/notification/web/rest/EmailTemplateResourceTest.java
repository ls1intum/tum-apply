package de.tum.cit.aet.notification.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.core.security.annotations.Professor;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.dto.EmailTemplateDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateOverviewDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateTranslationDTO;
import de.tum.cit.aet.notification.service.EmailTemplateService;
import de.tum.cit.aet.notification.web.EmailTemplateResource;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class EmailTemplateResourceTest {

    @Mock
    private EmailTemplateService emailTemplateService;

    @Mock
    private CurrentUserService currentUserService;

    private MockMvc mvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void init() {
        EmailTemplateResource resource = new EmailTemplateResource(emailTemplateService, currentUserService);
        mvc = MockMvcBuilders.standaloneSetup(resource).build();
    }

    @Test
    void getTemplates_returnsFlatList() throws Exception {
        UUID id = UUID.randomUUID();
        ResearchGroup rg = new ResearchGroup();
        when(currentUserService.getResearchGroupIfProfessor()).thenReturn(rg);
        when(emailTemplateService.listMerged(rg)).thenReturn(
            List.of(
                new EmailTemplateOverviewDTO(
                    id,
                    EmailType.APPLICATION_SENT,
                    true,
                    new EmailTemplateTranslationDTO("S", "B"),
                    new EmailTemplateTranslationDTO("S", "B"),
                    "F",
                    "L",
                    null
                )
            )
        );

        mvc
            .perform(get("/api/email-templates"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].emailTemplateId").value(id.toString()))
            .andExpect(jsonPath("$[0].isCustom").value(true));
    }

    @Test
    void getTemplate_returnsCustom() throws Exception {
        UUID id = UUID.randomUUID();
        when(emailTemplateService.getTemplate(id)).thenReturn(
            new EmailTemplateDTO(
                id,
                EmailType.APPLICATION_SENT,
                new EmailTemplateTranslationDTO("S", "B"),
                new EmailTemplateTranslationDTO("S", "B")
            )
        );

        mvc.perform(get("/api/email-templates/{id}", id)).andExpect(status().isOk()).andExpect(jsonPath("$.emailTemplateId").value(id.toString()));
    }

    @Test
    void createTemplate_returns201() throws Exception {
        UUID id = UUID.randomUUID();
        ResearchGroup rg = new ResearchGroup();
        User user = new User();
        when(currentUserService.getResearchGroupIfProfessor()).thenReturn(rg);
        when(currentUserService.getUser()).thenReturn(user);
        when(emailTemplateService.createTemplate(any(EmailTemplateDTO.class), any(ResearchGroup.class), any(User.class))).thenReturn(
            new EmailTemplateDTO(
                id,
                EmailType.APPLICATION_SENT,
                new EmailTemplateTranslationDTO("S", "B"),
                new EmailTemplateTranslationDTO("S", "B")
            )
        );

        EmailTemplateDTO body = new EmailTemplateDTO(
            null,
            EmailType.APPLICATION_SENT,
            new EmailTemplateTranslationDTO("S", "B"),
            new EmailTemplateTranslationDTO("S", "B")
        );

        mvc
            .perform(post("/api/email-templates").contentType("application/json").content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated());
    }

    @Test
    void updateTemplate_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(emailTemplateService.updateTemplate(any(EmailTemplateDTO.class))).thenReturn(
            new EmailTemplateDTO(
                id,
                EmailType.APPLICATION_SENT,
                new EmailTemplateTranslationDTO("S", "B"),
                new EmailTemplateTranslationDTO("S", "B")
            )
        );

        EmailTemplateDTO body = new EmailTemplateDTO(
            id,
            EmailType.APPLICATION_SENT,
            new EmailTemplateTranslationDTO("S", "B"),
            new EmailTemplateTranslationDTO("S", "B")
        );

        mvc
            .perform(put("/api/email-templates").contentType("application/json").content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk());
    }

    @Test
    void deleteTemplate_returns204() throws Exception {
        UUID id = UUID.randomUUID();
        mvc.perform(delete("/api/email-templates/{id}", id)).andExpect(status().isNoContent());
        verify(emailTemplateService).deleteTemplate(id);
    }

    @Test
    void deleteEndpoint_isAnnotatedProfessorOnly() throws NoSuchMethodException {
        Method method = EmailTemplateResource.class.getDeclaredMethod("deleteTemplate", UUID.class);
        boolean professor = false;
        boolean professorOrEmployee = false;
        for (Annotation a : method.getAnnotations()) {
            if (a.annotationType() == Professor.class) professor = true;
            if (a.annotationType() == ProfessorOrEmployee.class) professorOrEmployee = true;
        }
        assertThat(professor).isTrue();
        assertThat(professorOrEmployee).isFalse();
    }
}
