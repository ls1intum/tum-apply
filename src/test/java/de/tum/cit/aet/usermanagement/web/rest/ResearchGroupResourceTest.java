package de.tum.cit.aet.usermanagement.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupDepartment;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupSchool;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.*;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.web.ResearchGroupResource;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Integration tests for {@link ResearchGroupResource}.
 * Tests all REST endpoints for research group management including:
 * - CRUD operations
 * - Admin workflows (activate, deny, withdraw)
 * - Access control and authentication
 * - Pagination and filtering
 */
public class ResearchGroupResourceTest extends AbstractResourceTest {

    private static final String API_BASE_PATH = "/api/research-groups";
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int DEFAULT_PAGE_NUMBER = 0;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    ResearchGroup researchGroup;
    ResearchGroup secondResearchGroup;
    User researchGroupUser;
    User secondResearchGroupUser;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        researchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Prof. Smith",
            "Machine Learning Lab",
            "ML",
            "Munich",
            "Computer Science",
            "We research ML algorithms",
            "contact@ml.tum.de",
            "80333",
            ResearchGroupSchool.CIT,
            "Arcisstr. 21",
            "https://ml.tum.de",
            "ACTIVE",
            ResearchGroupDepartment.MATHEMATICS
        );
        secondResearchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Dr. Doe",
            "Other Lab",
            "OL",
            "Munich",
            "Physics",
            "Other research",
            "contact@other.tum.de",
            "80335",
            ResearchGroupSchool.CIT,
            "Otherstr. 10",
            "https://other.tum.de",
            "ACTIVE",
            ResearchGroupDepartment.MATHEMATICS
        );
        researchGroupUser = UserTestData.savedProfessor(userRepository, researchGroup);
        secondResearchGroupUser = UserTestData.savedProfessor(userRepository, secondResearchGroup);
    }

    @Test
    void getResearchGroupDetailsExistingIdReturnsDetails() {
        ResearchGroupLargeDTO result = api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(API_BASE_PATH + "/detail/" + researchGroup.getResearchGroupId(), Map.of(), ResearchGroupLargeDTO.class, 200);

        assertThat(researchGroupUser.getResearchGroup().getResearchGroupId()).isEqualTo(researchGroup.getResearchGroupId());
        assertThat(result.description()).isEqualTo("We research ML algorithms");
        assertThat(result.email()).isEqualTo("contact@ml.tum.de");
        assertThat(result.website()).isEqualTo("https://ml.tum.de");
        assertThat(result.street()).isEqualTo("Arcisstr. 21");
        assertThat(result.postalCode()).isEqualTo("80333");
        assertThat(result.city()).isEqualTo("Munich");
    }

    @Test
    void getResearchGroupDetailsNoIdAndNonExistingIdThrowsException() {
        api.getAndRead(API_BASE_PATH + "/detail/", Map.of(), ResearchGroupLargeDTO.class, 500);
        UUID nonExistingId = UUID.randomUUID();
        api.getAndRead(API_BASE_PATH + "/detail/" + nonExistingId, Map.of(), ResearchGroupLargeDTO.class, 403);
    }

    @Test
    void getResearchGroupDetailsOtherUsersGroupReturnsForbidden() {
        api.getAndRead(API_BASE_PATH + "/detail/" + secondResearchGroup.getResearchGroupId(), Map.of(), ResearchGroupLargeDTO.class, 403);
    }

    // --- GET /api/research-groups (getAllResearchGroups) ---

    @Test
    void getAllResearchGroupsReturnsPagedResults() {
        PageResponseDTO<ResearchGroupDTO> result = api.getAndRead(
            API_BASE_PATH,
            Map.of("pageNumber", String.valueOf(DEFAULT_PAGE_NUMBER), "pageSize", String.valueOf(DEFAULT_PAGE_SIZE)),
            new TypeReference<PageResponseDTO<ResearchGroupDTO>>() {},
            200
        );

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent()).hasSize(2); // 2 research groups in setup

        List<ResearchGroupDTO> contentList = new ArrayList<>(result.getContent());
        assertThat(contentList.get(0).name()).isEqualTo("Machine Learning Lab");
        assertThat(contentList.get(0).abbreviation()).isEqualTo("ML");
        assertThat(contentList.get(0).email()).isEqualTo("contact@ml.tum.de");
        assertThat(contentList.get(1).name()).isEqualTo("Other Lab");
        assertThat(contentList.get(1).abbreviation()).isEqualTo("OL");
        assertThat(contentList.get(1).email()).isEqualTo("contact@other.tum.de");
    }

    @Test
    void getAllResearchGroupsWithPaginationWorks() {
        PageResponseDTO<ResearchGroupDTO> result = api.getAndRead(
            API_BASE_PATH,
            Map.of("pageNumber", String.valueOf(DEFAULT_PAGE_NUMBER), "pageSize", "1"),
            new TypeReference<PageResponseDTO<ResearchGroupDTO>>() {},
            200
        );

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(2);

        List<ResearchGroupDTO> contentList = new ArrayList<>(result.getContent());
        assertThat(contentList.get(0).name()).isEqualTo("Machine Learning Lab");
        assertThat(contentList.get(0).abbreviation()).isEqualTo("ML");
        assertThat(contentList.get(0).email()).isEqualTo("contact@ml.tum.de");
    }

    // --- GET /api/research-groups/{id} (getResearchGroup) ---

    @Test
    void getResearchGroupByIdReturnsCorrectGroup() {
        ResearchGroupDTO result = api.getAndRead(
            API_BASE_PATH + "/" + researchGroup.getResearchGroupId(),
            Map.of(),
            ResearchGroupDTO.class,
            200
        );

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Machine Learning Lab");
        assertThat(result.head()).isEqualTo("Prof. Smith");
        assertThat(result.abbreviation()).isEqualTo("ML");
    }

    @Test
    void getResearchGroupByNonExistingIdReturns404() {
        UUID nonExistingId = UUID.randomUUID();
        api.getAndRead(API_BASE_PATH + "/" + nonExistingId, Map.of(), ResearchGroupDTO.class, 404);
    }

    // --- GET /api/research-groups/members (getResearchGroupMembers) ---

    @Test
    void getResearchGroupMembersReturnsPaginatedMembers() {
        PageResponseDTO<UserShortDTO> result = api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                API_BASE_PATH + "/members",
                Map.of("pageNumber", String.valueOf(DEFAULT_PAGE_NUMBER), "pageSize", String.valueOf(DEFAULT_PAGE_SIZE)),
                new TypeReference<PageResponseDTO<UserShortDTO>>() {},
                200
            );

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isNotEmpty();

        List<UserShortDTO> contentList = new ArrayList<>(result.getContent());
        assertThat(contentList).anyMatch(user -> user.getUserId().equals(researchGroupUser.getUserId()));
        assertThat(contentList).hasSize(1);

        assertThat(contentList.get(0).getUserId()).isEqualTo(researchGroupUser.getUserId());
        assertThat(contentList.get(0).getEmail()).isEqualTo(researchGroupUser.getEmail());
    }

    @Test
    void getResearchGroupMembersWithoutAuthenticationReturns403() {
        api.getAndRead(
            API_BASE_PATH + "/members",
            Map.of("pageNumber", String.valueOf(DEFAULT_PAGE_NUMBER), "pageSize", String.valueOf(DEFAULT_PAGE_SIZE)),
            Void.class,
            403
        );
    }

    // --- DELETE /api/research-groups/members/{userId}
    // (removeMemberFromResearchGroup) ---

    @Test
    void removeMemberFromResearchGroupReturnsNoContent() {
        User memberToRemove = UserTestData.savedProfessor(userRepository, researchGroup);

        api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .deleteAndRead(API_BASE_PATH + "/members/" + memberToRemove.getUserId(), null, Void.class, 204);

        // Verify member was removed
        User updatedUser = userRepository.findById(memberToRemove.getUserId()).orElse(null);
        assertThat(updatedUser).isNotNull();
        assertThat(updatedUser.getResearchGroup()).isNull();
    }

    @Test
    void removeMemberFromResearchGroupWithoutAuthenticationReturns403() {
        api.deleteAndRead(API_BASE_PATH + "/members/" + UUID.randomUUID(), null, Void.class, 403);
    }

    // --- PUT /api/research-groups/{id} (updateResearchGroup) ---

    @Test
    void updateResearchGroupReturnsUpdatedGroup() {
        ResearchGroupDTO updateDTO = ResearchGroupTestData.createResearchGroupDTO(
            "Updated ML Lab",
            "UML",
            "Prof. Smith",
            ResearchGroupDepartment.MATHEMATICS,
            ResearchGroupSchool.CIT,
            "updated@ml.tum.de",
            "https://updated.ml.tum.de",
            "Updated description",
            "AI",
            "Arcisstr. 21",
            "80333",
            "Munich",
            ResearchGroupState.ACTIVE
        );

        ResearchGroupDTO result = api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(API_BASE_PATH + "/" + researchGroup.getResearchGroupId(), updateDTO, ResearchGroupDTO.class, 200);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Updated ML Lab");
        assertThat(result.abbreviation()).isEqualTo("UML");
        assertThat(result.email()).isEqualTo("updated@ml.tum.de");
    }

    @Test
    void updateResearchGroupWithInvalidDataReturns400() {
        ResearchGroupDTO invalidDTO = ResearchGroupTestData.createResearchGroupDTO(
            "", // Invalid: empty name
            "ML",
            "", // Invalid: empty head
            ResearchGroupDepartment.MATHEMATICS,
            ResearchGroupSchool.CIT,
            "invalid-email", // Invalid email
            "https://ml.tum.de",
            "Description",
            "AI",
            "Street",
            "80333",
            "Munich",
            ResearchGroupState.ACTIVE
        );

        api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(API_BASE_PATH + "/" + researchGroup.getResearchGroupId(), invalidDTO, ResearchGroupDTO.class, 400);
    }

    // --- POST /api/research-groups/professor-request
    // (createProfe`ssorResearchGroupRequest) ---

    @Test
    void createResearchGroupRequestCreatesGroupInDraftState() {
        User requestUser = UserTestData.createUserWithoutResearchGroup(userRepository, "john.doe@tum.de", "John", "Doe", "ab12cde");

        ResearchGroupRequestDTO request = new ResearchGroupRequestDTO(
            "Dr.",
            "John",
            "Doe",
            "ab12cde",
            "Dr. John Doe",
            "New Research Lab",
            ResearchGroupDepartment.MATHEMATICS,
            ResearchGroupSchool.CIT,
            "contact@newlab.tum.de",
            "https://newlab.tum.de",
            "Engineering",
            "Research on new topics",
            "Engineering Science",
            "Boltzmannstr. 3",
            "85748",
            "Garching"
        );

        ResearchGroupDTO result = api
            .with(JwtPostProcessors.jwtUser(requestUser.getUserId(), "ROLE_USER"))
            .postAndRead(API_BASE_PATH + "/professor-request", request, ResearchGroupDTO.class, 201);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("New Research Lab");
        assertThat(result.state()).isEqualTo(ResearchGroupState.DRAFT);
        assertThat(result.abbreviation()).isEqualTo(ResearchGroupSchool.CIT);
    }

    @Test
    void createResearchGroupRequestWithMinimalDataWorks() {
        User requestUser = UserTestData.createUserWithoutResearchGroup(userRepository, "minimal.user@tum.de", "Minimal", "User", "mn33zzz");

        ResearchGroupRequestDTO minimalRequest = new ResearchGroupRequestDTO(
            "Prof.",
            "Minimal",
            "User",
            "mn33zzz",
            "Prof. Minimal User",
            "Minimal Research Lab",
            ResearchGroupDepartment.MATHEMATICS,
            ResearchGroupSchool.CIT,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        );

        ResearchGroupDTO result = api
            .with(JwtPostProcessors.jwtUser(requestUser.getUserId(), "ROLE_USER"))
            .postAndRead(API_BASE_PATH + "/professor-request", minimalRequest, ResearchGroupDTO.class, 201);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Minimal Research Lab");
        assertThat(result.state()).isEqualTo(ResearchGroupState.DRAFT);
    }

    @Test
    void createResearchGroupRequestWithoutAuthenticationReturns403() {
        ResearchGroupRequestDTO request = new ResearchGroupRequestDTO(
            "Dr.",
            "John",
            "Doe",
            "ab12cde",
            "Dr. John Doe",
            "New Research Lab",
            ResearchGroupDepartment.MATHEMATICS,
            ResearchGroupSchool.CIT,
            "contact@newlab.tum.de",
            "https://newlab.tum.de",
            "Engineering",
            "Research on new topics",
            "Engineering Science",
            "Boltzmannstr. 3",
            "85748",
            "Garching"
        );

        api.postAndRead(API_BASE_PATH + "/professor-request", request, ResearchGroupDTO.class, 403);
    }

    // --- POST /api/research-groups/employee-request
    // (createEmployeeResearchGroupRequest) ---

    @Test
    void createEmployeeResearchGroupRequestReturnsNoContent() {
        User employeeUser = UserTestData.createUserWithoutResearchGroup(userRepository, "employee@tum.de", "Employee", "User", "em11plp");

        EmployeeResearchGroupRequestDTO request = new EmployeeResearchGroupRequestDTO("Prof. Smith");

        api
            .with(JwtPostProcessors.jwtUser(employeeUser.getUserId(), "ROLE_USER"))
            .postAndRead(API_BASE_PATH + "/employee-request", request, Void.class, 204);
    }

    @Test
    void createEmployeeResearchGroupRequestWithEmptyProfessorNameReturns400() {
        User employeeUser = UserTestData.createUserWithoutResearchGroup(userRepository, "employee2@tum.de", "Employee2", "User", "em22plp");

        EmployeeResearchGroupRequestDTO invalidRequest = new EmployeeResearchGroupRequestDTO("");

        api
            .with(JwtPostProcessors.jwtUser(employeeUser.getUserId(), "ROLE_USER"))
            .postAndRead(API_BASE_PATH + "/employee-request", invalidRequest, Void.class, 400);
    }

    @Test
    void createEmployeeResearchGroupRequestWithoutAuthenticationReturns403() {
        EmployeeResearchGroupRequestDTO request = new EmployeeResearchGroupRequestDTO("Prof. Smith");
        api.postAndRead(API_BASE_PATH + "/employee-request", request, Void.class, 403);
    }

    // --- GET /api/research-groups/admin (getResearchGroupsForAdmin) ---

    @Test
    void getResearchGroupsForAdminReturnsPagedResults() {
        UUID adminUserId = UUID.randomUUID();
        PageResponseDTO<ResearchGroupAdminDTO> result = api
            .with(JwtPostProcessors.jwtUser(adminUserId, "ROLE_ADMIN"))
            .getAndRead(
                API_BASE_PATH + "/admin",
                Map.of(
                    "pageNumber",
                    String.valueOf(DEFAULT_PAGE_NUMBER),
                    "pageSize",
                    String.valueOf(DEFAULT_PAGE_SIZE),
                    "sortBy",
                    "createdAt",
                    "direction",
                    "DESC"
                ),
                new TypeReference<PageResponseDTO<ResearchGroupAdminDTO>>() {},
                200
            );

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isNotEmpty();

        List<ResearchGroupAdminDTO> contentList = new ArrayList<>(result.getContent());
        assertThat(contentList).hasSize(2); // 2 research groups in setup
        assertThat(contentList).anyMatch(group -> group.researchGroup().equals("Machine Learning Lab"));
        assertThat(contentList).anyMatch(group -> group.researchGroup().equals("Other Lab"));
    }

    @Test
    void getResearchGroupsForAdminWithSearchQueryFiltersResults() {
        UUID adminUserId = UUID.randomUUID();
        PageResponseDTO<ResearchGroupAdminDTO> result = api
            .with(JwtPostProcessors.jwtUser(adminUserId, "ROLE_ADMIN"))
            .getAndRead(
                API_BASE_PATH + "/admin",
                Map.of(
                    "pageNumber",
                    String.valueOf(DEFAULT_PAGE_NUMBER),
                    "pageSize",
                    String.valueOf(DEFAULT_PAGE_SIZE),
                    "searchQuery",
                    "Machine",
                    "sortBy",
                    "createdAt",
                    "direction",
                    "DESC"
                ),
                new TypeReference<PageResponseDTO<ResearchGroupAdminDTO>>() {},
                200
            );

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent().iterator().next().researchGroup()).contains("Machine");
    }

    @Test
    void getResearchGroupsForAdminWithoutAdminRoleReturns403() {
        api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                API_BASE_PATH + "/admin",
                Map.of(
                    "pageNumber",
                    String.valueOf(DEFAULT_PAGE_NUMBER),
                    "pageSize",
                    String.valueOf(DEFAULT_PAGE_SIZE),
                    "sortBy",
                    "createdAt",
                    "direction",
                    "DESC"
                ),
                Void.class,
                403
            );
    }

    // --- GET /api/research-groups/draft (getDraftResearchGroups) ---

    @Test
    void getDraftResearchGroupsReturnsOnlyDraftGroups() {
        // Create a draft research group
        ResearchGroup draftGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Draft Lab",
            "Prof. Draft",
            "draft@example.com",
            "DL",
            "Science",
            "Draft research",
            "contact@draft.tum.de",
            "80333",
            ResearchGroupSchool.CIT,
            "Draftstr. 1",
            "https://draft.tum.de",
            "DRAFT",
            ResearchGroupDepartment.MATHEMATICS
        );
        researchGroupRepository.save(draftGroup);

        UUID adminUserId = UUID.randomUUID();
        PageResponseDTO<ResearchGroupDTO> result = api
            .with(JwtPostProcessors.jwtUser(adminUserId, "ROLE_ADMIN"))
            .getAndRead(
                API_BASE_PATH + "/draft",
                Map.of("pageNumber", String.valueOf(DEFAULT_PAGE_NUMBER), "pageSize", String.valueOf(DEFAULT_PAGE_SIZE)),
                new TypeReference<PageResponseDTO<ResearchGroupDTO>>() {},
                200
            );

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getContent()).allMatch(rg -> rg.state() == ResearchGroupState.DRAFT);
    }

    @Test
    void getDraftResearchGroupsWithoutAdminRoleReturns403() {
        api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                API_BASE_PATH + "/draft",
                Map.of("pageNumber", String.valueOf(DEFAULT_PAGE_NUMBER), "pageSize", String.valueOf(DEFAULT_PAGE_SIZE)),
                Void.class,
                403
            );
    }

    // --- POST /api/research-groups/{researchGroupId}/activate
    // (activateResearchGroup) ---

    @Test
    void activateResearchGroupChangesStateToDraftToActive() {
        // Create a draft research group
        ResearchGroup draftGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Draft Lab for Activation",
            "Prof. Activation",
            "activate@example.com",
            "DLA",
            "Science",
            "Activation research",
            "contact@activate.tum.de",
            "80333",
            ResearchGroupSchool.CIT,
            "Activationstr. 1",
            "https://activate.tum.de",
            "DRAFT",
            ResearchGroupDepartment.MATHEMATICS
        );
        researchGroupRepository.save(draftGroup);

        UUID adminUserId = UUID.randomUUID();
        ResearchGroupDTO result = api
            .with(JwtPostProcessors.jwtUser(adminUserId, "ROLE_ADMIN"))
            .postAndRead(API_BASE_PATH + "/" + draftGroup.getResearchGroupId() + "/activate", null, ResearchGroupDTO.class, 200);

        assertThat(result).isNotNull();
        assertThat(result.state()).isEqualTo(ResearchGroupState.ACTIVE);
    }

    @Test
    void activateResearchGroupWithoutAdminRoleReturns403() {
        api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(API_BASE_PATH + "/" + researchGroup.getResearchGroupId() + "/activate", null, Void.class, 403);
    }

    // --- POST /api/research-groups/{researchGroupId}/deny (denyResearchGroup) ---

    @Test
    void denyResearchGroupChangesStateToDenied() {
        // Create a draft research group
        ResearchGroup draftGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Draft Lab for Denial",
            "Prof. Denial",
            "deny@example.com",
            "DLD",
            "Science",
            "Denial research",
            "contact@deny.tum.de",
            "80333",
            ResearchGroupSchool.CIT,
            "Denialstr. 1",
            "https://deny.tum.de",
            "DRAFT",
            ResearchGroupDepartment.MATHEMATICS
        );
        researchGroupRepository.save(draftGroup);

        UUID adminUserId = UUID.randomUUID();
        ResearchGroupDTO result = api
            .with(JwtPostProcessors.jwtUser(adminUserId, "ROLE_ADMIN"))
            .postAndRead(API_BASE_PATH + "/" + draftGroup.getResearchGroupId() + "/deny", null, ResearchGroupDTO.class, 200);

        assertThat(result).isNotNull();
        assertThat(result.state()).isEqualTo(ResearchGroupState.DENIED);
    }

    @Test
    void denyResearchGroupWithoutAdminRoleReturns403() {
        api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(API_BASE_PATH + "/" + researchGroup.getResearchGroupId() + "/deny", null, Void.class, 403);
    }

    // --- POST /api/research-groups/{researchGroupId}/withdraw
    // (withdrawResearchGroup) ---

    @Test
    void withdrawResearchGroupChangesStateBackToDraft() {
        // Create a separate research group for withdrawal
        ResearchGroup activeGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Prof. Withdrawal",
            "Lab for Withdrawal",
            "LFW",
            "Munich",
            "Science",
            "Withdrawal research",
            "contact@withdraw.tum.de",
            "80333",
            ResearchGroupSchool.CIT,
            "Withdrawstr. 1",
            "https://withdraw.tum.de",
            "ACTIVE",
            ResearchGroupDepartment.MATHEMATICS
        );
        activeGroup.setState(ResearchGroupState.ACTIVE);
        researchGroupRepository.save(activeGroup);

        UUID adminUserId = UUID.randomUUID();
        ResearchGroupDTO result = api
            .with(JwtPostProcessors.jwtUser(adminUserId, "ROLE_ADMIN"))
            .postAndRead(API_BASE_PATH + "/" + activeGroup.getResearchGroupId() + "/withdraw", null, ResearchGroupDTO.class, 200);

        assertThat(result).isNotNull();
        assertThat(result.state()).isEqualTo(ResearchGroupState.DRAFT);
    }

    @Test
    void withdrawResearchGroupWithoutAdminRoleReturns403() {
        api
            .with(JwtPostProcessors.jwtUser(researchGroupUser.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(API_BASE_PATH + "/" + researchGroup.getResearchGroupId() + "/withdraw", null, Void.class, 403);
    }
}
