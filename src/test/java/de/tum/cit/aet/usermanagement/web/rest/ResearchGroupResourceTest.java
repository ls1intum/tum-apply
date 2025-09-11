package de.tum.cit.aet.usermanagement.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import de.tum.cit.aet.utility.*;
import de.tum.cit.aet.utility.testDataGeneration.ResearchGroupTestData;
import de.tum.cit.aet.utility.testDataGeneration.UserTestData;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ResearchGroupResourceTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;
    @Autowired
    ResearchGroupRepository researchGroupRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    ResearchGroupService researchGroupService;

    private CurrentUserService mockCurrentUserService;

    MvcTestClient api;
    ResearchGroup researchGroup;
    ResearchGroup secondResearchGroup;
    User researchGroupUser;
    User secondResearchGroupUser;

    @BeforeEach
    public void setup() {
        api = new MvcTestClient(mockMvc, objectMapper);

        userRepository.deleteAll();
        researchGroupRepository.deleteAll();

        researchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Machine Learning Lab", "Prof. Smith", "ml@example.com", "ML",
                "Computer Science", "We research ML algorithms", "contact@ml.tum.de",
                "80333", "TUM", "Arcisstr. 21", "https://ml.tum.de");

        secondResearchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Other Lab", "Dr. Doe", "other@example.com", "OL",
                "Physics", "Other research", "contact@other.tum.de",
                "80335", "TUM", "Otherstr. 10", "https://other.tum.de");

        researchGroupUser = UserTestData.savedProfessor(userRepository, researchGroup);
        secondResearchGroupUser = UserTestData.savedProfessor(userRepository, secondResearchGroup);

        mockCurrentUserService = Mockito.mock(CurrentUserService.class);
        ReflectionTestUtils.setField(researchGroupService, "currentUserService", mockCurrentUserService);

    }

    private void setupMockUserService(User user) {
        Mockito.when(mockCurrentUserService.getUserIdIfAvailable())
                .thenReturn(Optional.of(user.getUserId()));
    }

    @Test
    @WithMockUser
    public void getResearchGroupDetailsExistingIdReturnsDetails() {
        setupMockUserService(researchGroupUser);
        ResearchGroupLargeDTO result = api.getAndReadOk(
                "/api/research-groups/detail/" + researchGroup.getResearchGroupId(),
                Map.of(),
                ResearchGroupLargeDTO.class);

        assertThat(researchGroupUser.getResearchGroup().getResearchGroupId())
                .isEqualTo(researchGroup.getResearchGroupId());
        assertThat(result.description()).isEqualTo("We research ML algorithms");
        assertThat(result.email()).isEqualTo("contact@ml.tum.de");
        assertThat(result.website()).isEqualTo("https://ml.tum.de");
        assertThat(result.street()).isEqualTo("Arcisstr. 21");
        assertThat(result.postalCode()).isEqualTo("80333");
        assertThat(result.city()).isEqualTo("ML");
    }

    @Test
    @WithMockUser
    void getResearchGroupDetailsNonExistingIdThrowsException() {
        UUID nonExistingId = UUID.randomUUID();

        assertThatThrownBy(() -> api.getAndReadOk(
                "/api/research-groups/detail/" + nonExistingId, Map.of(),
                ResearchGroupLargeDTO.class)).isInstanceOf(AssertionError.class);
    }

    @Test
    @WithMockUser
    void getResearchGroupDetailsNoIdThrowsException() {

        assertThatThrownBy(() -> api.getAndReadOk(
                "/api/research-groups/detail/", Map.of(),
                ResearchGroupLargeDTO.class)).isInstanceOf(AssertionError.class);
    }

    @Test
    @WithMockUser
    void getResearchGroupDetailsOtherUsersGroupReturnsForbidden() {

        assertThatThrownBy(() -> api.getAndReadOk(
                "/api/research-groups/detail/" + secondResearchGroup.getResearchGroupId(),
                Map.of(),
                ResearchGroupLargeDTO.class))
                .isInstanceOf(AssertionError.class);
    }
}
