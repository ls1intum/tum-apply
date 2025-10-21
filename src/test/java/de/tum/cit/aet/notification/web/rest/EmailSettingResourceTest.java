package de.tum.cit.aet.notification.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailSetting;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmailSettingResourceTest extends AbstractResourceTest {

    private static final String BASE_URL = "/api/settings/emails";

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    UserResearchGroupRoleRepository urrRepo;

    @Autowired
    EmailSettingRepository emailSettingRepository;

    @Autowired
    MvcTestClient api;

    User professor;
    ResearchGroup group;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        group = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, group);
    }

    private MvcTestClient asProfessor(User u) {
        return api.with(JwtPostProcessors.jwtUser(u.getUserId(), "ROLE_PROFESSOR"));
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getEmailSettingsCreatesDefaultsIfMissing() {
        assertThat(emailSettingRepository.findAllByUser(professor)).isEmpty();

        Set<EmailSettingDTO> result = asProfessor(professor).getAndRead(BASE_URL, null, new TypeReference<>() {}, 200);

        assertThat(result).isNotEmpty();
        assertThat(emailSettingRepository.findAllByUser(professor)).hasSize(result.size());
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateEmailSettingsUpdatesExistingSettings() {
        asProfessor(professor).getAndRead(BASE_URL, null, new TypeReference<Set<EmailSettingDTO>>() {}, 200);

        EmailSetting setting = emailSettingRepository.findAllByUser(professor).iterator().next();
        EmailSettingDTO update = new EmailSettingDTO(setting.getEmailType(), false);

        Set<EmailSettingDTO> updated = asProfessor(professor).putAndRead(BASE_URL, Set.of(update), new TypeReference<>() {}, 200);

        assertThat(updated).anyMatch(dto -> dto.emailType().equals(setting.getEmailType()) && !dto.enabled());

        EmailSetting reloaded = emailSettingRepository.findByUserAndEmailType(professor, setting.getEmailType()).orElseThrow();
        assertThat(reloaded.isEnabled()).isFalse();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateEmailSettingsWithInvalidTypeThrowsIllegalState() {
        asProfessor(professor).getAndRead(BASE_URL, null, new TypeReference<Set<EmailSettingDTO>>() {}, 200);

        EmailType invalid = EmailType.APPLICATION_WITHDRAWN;

        EmailSettingDTO update = new EmailSettingDTO(invalid, false);

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR")).putAndRead(BASE_URL, Set.of(update), Void.class, 400);
    }

    @Test
    void unauthenticatedReturns401() {
        api.withoutPostProcessors().getAndRead(BASE_URL, null, Void.class, 401);
        api.withoutPostProcessors().putAndRead(BASE_URL, Set.of(), Void.class, 401);
    }
}
