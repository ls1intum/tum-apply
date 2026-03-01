package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.*;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.notification.dto.ResearchGroupEmailContext;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.EmailTemplateService;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.*;
import de.tum.cit.aet.usermanagement.dto.*;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.utility.testdata.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ResearchGroupServiceTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final UUID TEST_RESEARCH_GROUP_ID = UUID.randomUUID();
    private static final UUID TEST_SCHOOL_ID = UUID.randomUUID();
    private static final UUID TEST_DEPARTMENT_ID = UUID.randomUUID();
    private static final String SUPPORT_EMAIL = "support@test.com";
    private static final UUID OTHER_USER_ID = UUID.randomUUID();

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResearchGroupRepository researchGroupRepository;

    @Mock
    private UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private KeycloakUserService keycloakUserService;

    @Mock
    private AsyncEmailSender emailSender;

    @Mock
    private EmailTemplateService emailTemplateService;

    @InjectMocks
    private ResearchGroupService researchGroupService;

    private User testUser;
    private School testSchool;
    private Department testDepartment;
    private ResearchGroup testResearchGroup;
    private PageDTO pageDTO;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(researchGroupService, "supportEmail", SUPPORT_EMAIL);

        // Initialize test school
        testSchool = SchoolTestData.newSchoolAll("School of Computation, Information and Technology", "CIT");
        testSchool.setSchoolId(TEST_SCHOOL_ID);

        // Initialize test department
        testDepartment = DepartmentTestData.newDepartmentAll("Computer Science", testSchool);
        testDepartment.setDepartmentId(TEST_DEPARTMENT_ID);

        // Initialize test research group using utility class
        testResearchGroup = ResearchGroupTestData.newRgAll(
            "Prof. Test",
            "Test Research Group",
            "TRG",
            "Test City",
            "Computer Science",
            "Test description",
            "test@research.com",
            "12345",
            "Test Street",
            "https://test.com",
            ResearchGroupState.ACTIVE.toString()
        );
        testResearchGroup.setResearchGroupId(TEST_RESEARCH_GROUP_ID);
        testResearchGroup.setDepartment(testDepartment);

        // Initialize test user using utility class
        testUser = UserTestData.newUserAll(TEST_USER_ID, "test@example.com", "Test", "User");

        pageDTO = PageTestData.createDefaultPageDTO(1, 10);
    }

    @Nested
    class GetResearchGroupMembers {

        @BeforeEach
        void setup() {
            when(currentUserService.getResearchGroupIdIfMember()).thenReturn(TEST_RESEARCH_GROUP_ID);
        }

        @Test
        void shouldReturnPaginatedMembersSuccessfully() {
            // Arrange
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);

            Page<UUID> userIdsPage = new PageImpl<>(List.of(TEST_USER_ID, OTHER_USER_ID));
            when(userRepository.findUserIdsByResearchGroupId(eq(TEST_RESEARCH_GROUP_ID), any(Pageable.class))).thenReturn(userIdsPage);

            User otherUser = UserTestData.newUserAll(OTHER_USER_ID, "other@test.com", null, null);
            otherUser.setResearchGroup(testResearchGroup);
            List<User> members = List.of(testUser, otherUser);
            when(userRepository.findUsersWithRolesByIdsForResearchGroup(anyList(), eq(TEST_USER_ID))).thenReturn(members);

            // Act
            PageResponseDTO<UserShortDTO> result = researchGroupService.getResearchGroupMembers(pageDTO);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2L);
            verify(userRepository).findUserIdsByResearchGroupId(eq(TEST_RESEARCH_GROUP_ID), any(Pageable.class));
        }

        @Test
        void shouldReturnEmptyListWhenNoMembers() {
            // Arrange
            Page<UUID> emptyPage = new PageImpl<>(List.of());
            when(userRepository.findUserIdsByResearchGroupId(eq(TEST_RESEARCH_GROUP_ID), any(Pageable.class))).thenReturn(emptyPage);

            // Act
            PageResponseDTO<UserShortDTO> result = researchGroupService.getResearchGroupMembers(pageDTO);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Arrange
        when(userRepository.findWithResearchGroupRolesByUserId(OTHER_USER_ID)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> researchGroupService.removeMemberFromResearchGroup(OTHER_USER_ID))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining("User");
    }

    @Nested
    class RemoveMemberFromResearchGroup {

        @BeforeEach
        void setup() {
            when(currentUserService.getResearchGroupIdIfMember()).thenReturn(TEST_RESEARCH_GROUP_ID);
        }

        @Test
        void shouldThrowExceptionWhenUserNotInSameResearchGroup() {
            // Arrange
            ResearchGroup otherGroup = ResearchGroupTestData.newRgAll(
                null,
                "Other Group",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                ResearchGroupState.ACTIVE.toString()
            );
            otherGroup.setResearchGroupId(UUID.randomUUID());
            User memberFromOtherGroup = UserTestData.newUserAll(OTHER_USER_ID, "other@test.com", null, null);
            memberFromOtherGroup.setResearchGroup(otherGroup);

            when(userRepository.findWithResearchGroupRolesByUserId(OTHER_USER_ID)).thenReturn(Optional.of(memberFromOtherGroup));

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.removeMemberFromResearchGroup(OTHER_USER_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not a member of your research group");
        }

        @Test
        void shouldThrowExceptionWhenRemovingSelf() {
            // Arrange
            User currentUser = UserTestData.newUserAll(TEST_USER_ID, "current@test.com", null, null);
            currentUser.setResearchGroup(testResearchGroup);
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(userRepository.findWithResearchGroupRolesByUserId(TEST_USER_ID)).thenReturn(Optional.of(currentUser));

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.removeMemberFromResearchGroup(TEST_USER_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot remove yourself");
        }
    }

    @Nested
    class GetResearchGroup {

        @Test
        void shouldReturnResearchGroupSuccessfully() {
            // Arrange
            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);

            // Act
            ResearchGroupDTO result = researchGroupService.getResearchGroup(TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.name()).isEqualTo(testResearchGroup.getName());
            verify(researchGroupRepository).findByIdElseThrow(TEST_RESEARCH_GROUP_ID);
        }
    }

    @Nested
    class GetResearchGroupDetails {

        @Test
        void shouldReturnResearchGroupDetailsSuccessfully() {
            // Arrange
            testResearchGroup.setDescription("Test description");
            testResearchGroup.setEmail("group@test.com");
            testResearchGroup.setWebsite("https://test.com");
            testResearchGroup.setStreet("Test Street");
            testResearchGroup.setPostalCode("12345");
            testResearchGroup.setCity("Test City");

            when(researchGroupRepository.findById(TEST_RESEARCH_GROUP_ID)).thenReturn(Optional.of(testResearchGroup));

            // Act
            ResearchGroupLargeDTO result = researchGroupService.getResearchGroupDetails(TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.description()).isEqualTo("Test description");
            assertThat(result.email()).isEqualTo("group@test.com");
            assertThat(result.website()).isEqualTo("https://test.com");
        }

        @Test
        void shouldThrowExceptionWhenResearchGroupNotFound() {
            // Arrange
            when(researchGroupRepository.findById(TEST_RESEARCH_GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.getResearchGroupDetails(TEST_RESEARCH_GROUP_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("ResearchGroup");
        }
    }

    @Nested
    class UpdateResearchGroup {

        @Test
        void shouldUpdateResearchGroupSuccessfully() {
            // Arrange
            ResearchGroupDTO updateDTO = new ResearchGroupDTO(
                "Updated Name",
                "UN",
                "Prof. Updated",
                "updated@test.com",
                "https://updated.com",
                "Updated description",
                "Computer Science",
                "Updated Street",
                "54321",
                "Updated City",
                TEST_DEPARTMENT_ID,
                ResearchGroupState.ACTIVE
            );

            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);
            when(researchGroupRepository.save(any(ResearchGroup.class))).thenReturn(testResearchGroup);

            // Act
            ResearchGroupDTO result = researchGroupService.updateResearchGroup(TEST_RESEARCH_GROUP_ID, updateDTO);

            // Assert
            assertThat(result).isNotNull();
            verify(researchGroupRepository).save(testResearchGroup);
            assertThat(testResearchGroup.getName()).isEqualTo("Updated Name");
            assertThat(testResearchGroup.getAbbreviation()).isEqualTo("UN");
        }
    }

    @Nested
    class ActivateResearchGroup {

        @Test
        void shouldActivateDraftResearchGroupSuccessfully() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.DRAFT);
            UserResearchGroupRole role = new UserResearchGroupRole();
            role.setUser(testUser);
            role.setRole(UserRole.APPLICANT);

            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);
            when(researchGroupRepository.save(testResearchGroup)).thenReturn(testResearchGroup);
            when(userResearchGroupRoleRepository.findAllByResearchGroup(testResearchGroup)).thenReturn(Set.of(role));

            // Act
            ResearchGroup result = researchGroupService.activateResearchGroup(TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result.getState()).isEqualTo(ResearchGroupState.ACTIVE);
            assertThat(role.getRole()).isEqualTo(UserRole.PROFESSOR);
            verify(researchGroupRepository).save(testResearchGroup);
            verify(userResearchGroupRoleRepository).save(role);
        }

        @Test
        void shouldActivateDeniedResearchGroup() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.DENIED);
            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);
            when(researchGroupRepository.save(testResearchGroup)).thenReturn(testResearchGroup);
            when(userResearchGroupRoleRepository.findAllByResearchGroup(testResearchGroup)).thenReturn(Set.of());

            // Act
            ResearchGroup result = researchGroupService.activateResearchGroup(TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result.getState()).isEqualTo(ResearchGroupState.ACTIVE);
        }

        @Test
        void shouldThrowExceptionWhenActivatingActiveGroup() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.ACTIVE);
            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.activateResearchGroup(TEST_RESEARCH_GROUP_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only DRAFT or DENIED groups can be activated");
        }

        @Test
        void sendsApprovalEmailToProfessorOnActivate() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.DRAFT);
            testResearchGroup.setUniversityId("uni123");

            User prof = UserTestData.newUserAll(UUID.randomUUID(), "prof@test.com", "Prof", "X");
            prof.setUniversityId("uni123");

            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);
            when(researchGroupRepository.save(testResearchGroup)).thenReturn(testResearchGroup);
            when(userResearchGroupRoleRepository.findAllByResearchGroup(testResearchGroup)).thenReturn(Set.of());
            when(userRepository.findByUniversityIdIgnoreCase("uni123")).thenReturn(Optional.of(prof));

            // Act
            researchGroupService.activateResearchGroup(TEST_RESEARCH_GROUP_ID);

            // Assert
            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
            verify(emailSender).sendAsync(emailCaptor.capture());
            Email sent = emailCaptor.getValue();
            assertThat(sent.getContent()).isInstanceOf(ResearchGroupEmailContext.class);
            ResearchGroupEmailContext context = (ResearchGroupEmailContext) sent.getContent();
            assertThat(context.researchGroup()).isEqualTo(testResearchGroup);
            assertThat(context.user().getEmail()).isEqualTo("prof@test.com");
            assertThat(sent.getTo()).anyMatch(u -> u.getEmail().equals("prof@test.com"));
        }
    }

    @Nested
    class DenyResearchGroup {

        @Test
        void shouldDenyDraftResearchGroupSuccessfully() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.DRAFT);
            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);
            when(researchGroupRepository.save(testResearchGroup)).thenReturn(testResearchGroup);

            // Act
            ResearchGroup result = researchGroupService.denyResearchGroup(TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result.getState()).isEqualTo(ResearchGroupState.DENIED);
            verify(researchGroupRepository).save(testResearchGroup);
        }

        @Test
        void shouldThrowExceptionWhenDenyingActiveGroup() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.ACTIVE);
            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.denyResearchGroup(TEST_RESEARCH_GROUP_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only DRAFT groups can be denied");
        }
    }

    @Nested
    class WithdrawResearchGroup {

        @Test
        void shouldWithdrawActiveResearchGroupSuccessfully() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.ACTIVE);
            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);
            when(researchGroupRepository.save(testResearchGroup)).thenReturn(testResearchGroup);

            // Act
            ResearchGroup result = researchGroupService.withdrawResearchGroup(TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result.getState()).isEqualTo(ResearchGroupState.DRAFT);
            verify(researchGroupRepository).save(testResearchGroup);
        }

        @Test
        void shouldThrowExceptionWhenWithdrawingDraftGroup() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.DRAFT);
            when(researchGroupRepository.findByIdElseThrow(TEST_RESEARCH_GROUP_ID)).thenReturn(testResearchGroup);

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.withdrawResearchGroup(TEST_RESEARCH_GROUP_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only ACTIVE groups can be withdrawn");
        }
    }

    @Nested
    class CreateResearchGroupRequest {

        @Test
        void shouldCreateResearchGroupRequestSuccessfully() {
            // Arrange
            ResearchGroupRequestDTO request = ResearchGroupTestData.createResearchGroupRequest("New Research Group", TEST_DEPARTMENT_ID);

            testUser.setResearchGroup(null);
            when(currentUserService.getUser()).thenReturn(testUser);
            when(departmentRepository.findByIdElseThrow(TEST_DEPARTMENT_ID)).thenReturn(testDepartment);
            when(researchGroupRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
            when(researchGroupRepository.save(any(ResearchGroup.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            ResearchGroup result = researchGroupService.createProfessorResearchGroupRequest(request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getState()).isEqualTo(ResearchGroupState.DRAFT);
            assertThat(result.getName()).contains("New Research Group");
            assertThat(result.getDepartment()).isEqualTo(testDepartment);
            verify(departmentRepository).findByIdElseThrow(TEST_DEPARTMENT_ID);
            verify(researchGroupRepository).save(any(ResearchGroup.class));
            verify(userRepository).save(testUser);
            verify(userResearchGroupRoleRepository).save(any(UserResearchGroupRole.class));
        }

        @Test
        void shouldThrowExceptionWhenUserAlreadyHasResearchGroup() {
            // Arrange
            testUser.setResearchGroup(testResearchGroup);
            when(currentUserService.getUser()).thenReturn(testUser);

            ResearchGroupRequestDTO request = ResearchGroupTestData.createResearchGroupRequest("New research group");

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.createProfessorResearchGroupRequest(request))
                .isInstanceOf(AlreadyMemberOfResearchGroupException.class)
                .hasMessageContaining("already belongs to a research group");
        }

        @Test
        void shouldThrowExceptionWhenResearchGroupNameAlreadyExists() {
            // Arrange
            testUser.setResearchGroup(null);
            when(currentUserService.getUser()).thenReturn(testUser);
            when(researchGroupRepository.existsByNameIgnoreCase(anyString())).thenReturn(true);

            ResearchGroupRequestDTO request = ResearchGroupTestData.createResearchGroupRequest("Existing Group");

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.createProfessorResearchGroupRequest(request))
                .isInstanceOf(ResourceAlreadyExistsException.class)
                .hasMessageContaining("already exists");
        }
    }

    @Nested
    class CreateResearchGroupAsAdmin {

        @Test
        void shouldCreateResearchGroupAsAdminUsingLocalMockFallbackWhenKeycloakHasNoResult() {
            // Arrange
            ReflectionTestUtils.setField(researchGroupService, "keycloakLocalMockEnabled", true);
            ReflectionTestUtils.setField(
                researchGroupService,
                "keycloakLocalMockFilePath",
                "src/main/webapp/content/mock/keycloak-users.json"
            );

            ResearchGroupRequestDTO request = new ResearchGroupRequestDTO(
                "Prof.",
                "Any",
                "User",
                "aa00boa",
                "Prof. Annika Mueller",
                "Admin Created Group",
                TEST_DEPARTMENT_ID,
                "admin-created@test.com",
                "ACG",
                "https://acg.test",
                "Description",
                "CS",
                "Main St",
                "12345",
                "Munich"
            );

            when(researchGroupRepository.existsByNameIgnoreCase("Admin Created Group")).thenReturn(false);
            when(userRepository.findByUniversityIdIgnoreCase("aa00boa")).thenReturn(Optional.empty());
            when(keycloakUserService.findUserByUniversityId("aa00boa")).thenReturn(Optional.empty());
            when(departmentRepository.findByIdElseThrow(TEST_DEPARTMENT_ID)).thenReturn(testDepartment);
            when(researchGroupRepository.save(any(ResearchGroup.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userResearchGroupRoleRepository.findByUserAndResearchGroup(any(User.class), any(ResearchGroup.class))).thenReturn(
                Optional.empty()
            );
            when(userResearchGroupRoleRepository.findAllByUser(any(User.class))).thenReturn(Set.of());

            // Act
            ResearchGroup created = researchGroupService.createResearchGroupAsAdmin(request);

            // Assert
            assertThat(created.getState()).isEqualTo(ResearchGroupState.ACTIVE);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository, atLeastOnce()).save(userCaptor.capture());
            assertThat(userCaptor.getAllValues()).anySatisfy(savedProfessor -> {
                assertThat(savedProfessor.getUniversityId()).isEqualTo("aa00boa");
                assertThat(savedProfessor.getFirstName()).isEqualTo("Annika");
                assertThat(savedProfessor.getLastName()).isEqualTo("Mueller");
            });
        }

        @Test
        void shouldThrowEntityNotFoundWhenFallbackIsDisabledAndKeycloakHasNoResult() {
            // Arrange
            ReflectionTestUtils.setField(researchGroupService, "keycloakLocalMockEnabled", false);

            ResearchGroupRequestDTO request = ResearchGroupTestData.createResearchGroupRequest("Admin Group", TEST_DEPARTMENT_ID);

            when(researchGroupRepository.existsByNameIgnoreCase("Admin Group")).thenReturn(false);
            when(userRepository.findByUniversityIdIgnoreCase("ab12cde")).thenReturn(Optional.empty());
            when(keycloakUserService.findUserByUniversityId("ab12cde")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.createResearchGroupAsAdmin(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("ab12cde");
        }
    }

    @Nested
    class CreateEmployeeResearchGroupRequest {

        @Test
        void shouldSendEmailToSupportSuccessfully() {
            // Arrange
            EmployeeResearchGroupRequestDTO request = new EmployeeResearchGroupRequestDTO("Prof. Smith");
            testUser.setUniversityId("ab12cde");
            when(currentUserService.getUser()).thenReturn(testUser);

            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);

            // Act
            researchGroupService.createEmployeeResearchGroupRequest(request);

            // Assert
            verify(emailSender).sendAsync(emailCaptor.capture());
            Email sentEmail = emailCaptor.getValue();
            assertThat(sentEmail).isNotNull();
            assertThat(sentEmail.getCustomBody()).contains("Prof. Smith");
            assertThat(sentEmail.getCustomBody()).contains(testUser.getEmail());
            assertThat(sentEmail.getCustomSubject()).contains(testUser.getEmail());
        }
    }

    @Nested
    class GetAllResearchGroups {

        @Test
        void shouldReturnAllResearchGroupsPaginated() {
            // Arrange
            Page<ResearchGroup> page = new PageImpl<>(List.of(testResearchGroup));
            when(researchGroupRepository.findAll(any(Pageable.class))).thenReturn(page);

            // Act
            PageResponseDTO<ResearchGroupDTO> result = researchGroupService.getAllResearchGroups(pageDTO);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            verify(researchGroupRepository).findAll(any(Pageable.class));
        }
    }

    @Nested
    class GetDraftResearchGroups {

        @Test
        void shouldReturnDraftResearchGroups() {
            // Arrange
            testResearchGroup.setState(ResearchGroupState.DRAFT);
            Page<ResearchGroup> page = new PageImpl<>(List.of(testResearchGroup));
            when(researchGroupRepository.findByState(eq(ResearchGroupState.DRAFT), any(Pageable.class))).thenReturn(page);

            // Act
            PageResponseDTO<ResearchGroupDTO> result = researchGroupService.getDraftResearchGroups(pageDTO);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            verify(researchGroupRepository).findByState(eq(ResearchGroupState.DRAFT), any(Pageable.class));
        }
    }

    @Nested
    class GetResearchGroupsForAdmin {

        @Test
        void shouldReturnFilteredResearchGroupsForAdmin() {
            // Arrange
            AdminResearchGroupFilterDTO filterDTO = new AdminResearchGroupFilterDTO(List.of(ResearchGroupState.ACTIVE), "Test");
            SortDTO sortDTO = new SortDTO("name", SortDTO.Direction.ASC);

            SchoolShortDTO schoolDTO = new SchoolShortDTO(UUID.randomUUID(), "School of CIT", "CIT");
            DepartmentDTO departmentDTO = new DepartmentDTO(UUID.randomUUID(), "Computer Science", schoolDTO);

            ResearchGroupAdminDTO adminDTO = new ResearchGroupAdminDTO(
                TEST_RESEARCH_GROUP_ID,
                "Test Group",
                "Prof. Test",
                departmentDTO,
                ResearchGroupState.ACTIVE,
                LocalDateTime.now()
            );
            Page<ResearchGroupAdminDTO> page = new PageImpl<>(List.of(adminDTO));

            when(researchGroupRepository.findAllForAdmin(anyList(), anyString(), any(Pageable.class))).thenReturn(page);

            // Act
            PageResponseDTO<ResearchGroupAdminDTO> result = researchGroupService.getResearchGroupsForAdmin(pageDTO, filterDTO, sortDTO);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            verify(researchGroupRepository).findAllForAdmin(anyList(), anyString(), any(Pageable.class));
        }
    }
}
