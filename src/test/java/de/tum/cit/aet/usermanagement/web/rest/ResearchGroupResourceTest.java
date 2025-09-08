package de.tum.cit.aet.usermanagement.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;

import java.util.Map;
import java.util.UUID;

import de.tum.cit.aet.utility.*;
import de.tum.cit.aet.utility.testDataGeneration.ResearchGroupTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
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

    MvcTestClient api;
    ResearchGroup researchGroup;

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

    }

    @Test
    @WithMockUser
    public void getResourceGroupDetails_existingId_returnsDetails() {
        ResearchGroupLargeDTO result = api.getAndReadOk(
                "/api/research-groups/detail/" + researchGroup.getResearchGroupId(),
                Map.of(),
                ResearchGroupLargeDTO.class);

        assertThat(result.description()).isEqualTo("We research ML algorithms");
        assertThat(result.email()).isEqualTo("contact@ml.tum.de");
        assertThat(result.website()).isEqualTo("https://ml.tum.de");
        assertThat(result.street()).isEqualTo("Arcisstr. 21");
        assertThat(result.postalCode()).isEqualTo("80333");
        assertThat(result.city()).isEqualTo("ML");
    }

    @Test
    void getResourceGroupDetails_nonExistingId_throwsException() {
        UUID nonExistingId = UUID.randomUUID();

        assertThatThrownBy(() -> api.getAndReadOk(
                "/api/research-groups/detail/" + nonExistingId, Map.of(),
                ResearchGroupLargeDTO.class)).isInstanceOf(AssertionError.class);
    }
}
