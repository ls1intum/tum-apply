package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.AlreadyMemberOfResearchGroupException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.*;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.time.LocalDateTime;
import java.util.*;
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

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResearchGroupRepository researchGroupRepository;

    @Mock
    private UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    @Mock
    private AsyncEmailSender emailSender;

    @InjectMocks
    private ResearchGroupService researchGroupService;

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final UUID TEST_RESEARCH_GROUP_ID = UUID.randomUUID();
    private static final UUID OTHER_USER_ID = UUID.randomUUID();
    private static final String SUPPORT_EMAIL = "support@test.com";

    private User testUser;
    private ResearchGroup testResearchGroup;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(researchGroupService, "supportEmail", SUPPORT_EMAIL);

        // Initialize test user
        testUser = new User();
        testUser.setUserId(TEST_USER_ID);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");

        // Initialize test research group
        testResearchGroup = new ResearchGroup();
        testResearchGroup.setResearchGroupId(TEST_RESEARCH_GROUP_ID);
        testResearchGroup.setName("Test Research Group");
        testResearchGroup.setHead("Prof. Test");
        testResearchGroup.setState(ResearchGroupState.ACTIVE);
    }

    // --- Helper Methods ---

    private User createUser(UUID userId, String email, ResearchGroup researchGroup) {
        User user = new User();
        user.setUserId(userId);
        user.setEmail(email);
        user.setResearchGroup(researchGroup);
        return user;
    }

    private ResearchGroup createResearchGroup(UUID id, String name, ResearchGroupState state) {
        ResearchGroup rg = new ResearchGroup();
        rg.setResearchGroupId(id);
        rg.setName(name);
        rg.setState(state);
        return rg;
    }

    @Nested
    class GetResearchGroupMembers {

        @Test
        void shouldReturnPaginatedMembersSuccessfully() {
            // Arrange
            PageDTO pageDTO = new PageDTO(10, 0);
            when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(TEST_RESEARCH_GROUP_ID);
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);

            Page<UUID> userIdsPage = new PageImpl<>(List.of(TEST_USER_ID, OTHER_USER_ID));
            when(userRepository.findUserIdsByResearchGroupId(eq(TEST_RESEARCH_GROUP_ID), any(Pageable.class))).thenReturn(userIdsPage);

            List<User> members = List.of(testUser, createUser(OTHER_USER_ID, "other@test.com", testResearchGroup));
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
            PageDTO pageDTO = new PageDTO(10, 0);
            when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(TEST_RESEARCH_GROUP_ID);

            Page<UUID> emptyPage = new PageImpl<>(List.of());
            when(userRepository.findUserIdsByResearchGroupId(eq(TEST_RESEARCH_GROUP_ID), any(Pageable.class))).thenReturn(emptyPage);

            // Act
            PageResponseDTO<UserShortDTO> result = researchGroupService.getResearchGroupMembers(pageDTO);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }

    @Nested
    class RemoveMemberFromResearchGroup {

        @Test
        void shouldRemoveMemberSuccessfully() {
            // Arrange
            User memberToRemove = createUser(OTHER_USER_ID, "member@test.com", testResearchGroup);
            when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(TEST_RESEARCH_GROUP_ID);
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(userRepository.findWithResearchGroupRolesByUserId(OTHER_USER_ID)).thenReturn(Optional.of(memberToRemove));

            // Act
            researchGroupService.removeMemberFromResearchGroup(OTHER_USER_ID);

            // Assert
            assertThat(memberToRemove.getResearchGroup()).isNull();
            verify(userRepository).save(memberToRemove);
            verify(userResearchGroupRoleRepository).removeResearchGroupFromUserRoles(OTHER_USER_ID);
        }

        @Test
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(TEST_RESEARCH_GROUP_ID);
            when(userRepository.findWithResearchGroupRolesByUserId(OTHER_USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.removeMemberFromResearchGroup(OTHER_USER_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User");
        }

        @Test
        void shouldThrowExceptionWhenUserNotInSameResearchGroup() {
            // Arrange
            ResearchGroup otherGroup = createResearchGroup(UUID.randomUUID(), "Other Group", ResearchGroupState.ACTIVE);
            User memberFromOtherGroup = createUser(OTHER_USER_ID, "other@test.com", otherGroup);

            when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(TEST_RESEARCH_GROUP_ID);
            when(userRepository.findWithResearchGroupRolesByUserId(OTHER_USER_ID)).thenReturn(Optional.of(memberFromOtherGroup));

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.removeMemberFromResearchGroup(OTHER_USER_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not a member of your research group");
        }

        @Test
        void shouldThrowExceptionWhenRemovingSelf() {
            // Arrange
            User currentUser = createUser(TEST_USER_ID, "current@test.com", testResearchGroup);
            when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(TEST_RESEARCH_GROUP_ID);
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(userRepository.findWithResearchGroupRolesByUserId(TEST_USER_ID)).thenReturn(Optional.of(currentUser));

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.removeMemberFromResearchGroup(TEST_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
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
                "Updated School",
                "Updated description",
                "Computer Science",
                "Updated Street",
                "54321",
                "Updated City",
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
    class ProvisionResearchGroup {

        @Test
        void shouldProvisionResearchGroupSuccessfully() {
            // Arrange
            String universityId = "ab12cde";
            ResearchGroupProvisionDTO dto = new ResearchGroupProvisionDTO(universityId, TEST_RESEARCH_GROUP_ID);

            User user = createUser(TEST_USER_ID, "user@test.com", null);
            when(userRepository.findByUniversityIdIgnoreCase(universityId)).thenReturn(Optional.of(user));
            when(researchGroupRepository.findById(TEST_RESEARCH_GROUP_ID)).thenReturn(Optional.of(testResearchGroup));
            when(userResearchGroupRoleRepository.findByUserAndResearchGroup(user, testResearchGroup)).thenReturn(Optional.empty());

            // Act
            ResearchGroup result = researchGroupService.provisionResearchGroup(dto);

            // Assert
            assertThat(result).isEqualTo(testResearchGroup);
            assertThat(user.getResearchGroup()).isEqualTo(testResearchGroup);
            verify(userRepository).save(user);
            verify(userResearchGroupRoleRepository).save(any(UserResearchGroupRole.class));
        }

        @Test
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            ResearchGroupProvisionDTO dto = new ResearchGroupProvisionDTO("nonexistent", UUID.randomUUID());
            when(userRepository.findByUniversityIdIgnoreCase("nonexistent")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.provisionResearchGroup(dto))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("universityId");
        }

        @Test
        void shouldThrowExceptionWhenResearchGroupNotFound() {
            // Arrange
            ResearchGroupProvisionDTO dto = new ResearchGroupProvisionDTO("ab12cde", TEST_RESEARCH_GROUP_ID);
            when(userRepository.findByUniversityIdIgnoreCase("ab12cde")).thenReturn(Optional.of(testUser));
            when(researchGroupRepository.findById(TEST_RESEARCH_GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.provisionResearchGroup(dto))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("ResearchGroup");
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
    class CreateProfessorResearchGroupRequest {

        @Test
        void shouldCreateResearchGroupRequestSuccessfully() {
            // Arrange
            ProfessorResearchGroupRequestDTO request = new ProfessorResearchGroupRequestDTO(
                "Prof.",
                "John",
                "Doe",
                "ab12cde",
                "Prof. New",
                "New Research Group",
                "NRG",
                "nrg@test.com",
                "https://nrg.com",
                "Computer Science",
                "Description",
                "CS",
                "Main St",
                "12345",
                "City"
            );

            testUser.setResearchGroup(null);
            when(currentUserService.getUser()).thenReturn(testUser);
            when(researchGroupRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
            when(researchGroupRepository.save(any(ResearchGroup.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userResearchGroupRoleRepository.findAllByUser(testUser)).thenReturn(Set.of());

            // Act
            ResearchGroup result = researchGroupService.createProfessorResearchGroupRequest(request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getState()).isEqualTo(ResearchGroupState.DRAFT);
            assertThat(result.getName()).contains("New Research Group");
            verify(researchGroupRepository).save(any(ResearchGroup.class));
            verify(userRepository).save(testUser);
            verify(userResearchGroupRoleRepository).save(any(UserResearchGroupRole.class));
        }

        @Test
        void shouldThrowExceptionWhenUserAlreadyHasResearchGroup() {
            // Arrange
            testUser.setResearchGroup(testResearchGroup);
            when(currentUserService.getUser()).thenReturn(testUser);

            ProfessorResearchGroupRequestDTO request = new ProfessorResearchGroupRequestDTO(
                "Prof.",
                "John",
                "Doe",
                "ab12cde",
                "Prof",
                "New Group",
                "NG",
                "test@test.com",
                "https://test.com",
                "School",
                "Desc",
                "CS",
                "Street",
                "12345",
                "City"
            );

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

            ProfessorResearchGroupRequestDTO request = new ProfessorResearchGroupRequestDTO(
                "Prof.",
                "John",
                "Doe",
                "ab12cde",
                "Prof",
                "Existing Group",
                "EG",
                "test@test.com",
                "https://test.com",
                "School",
                "Desc",
                "CS",
                "Street",
                "12345",
                "City"
            );

            // Act & Assert
            assertThatThrownBy(() -> researchGroupService.createProfessorResearchGroupRequest(request))
                .isInstanceOf(ResourceAlreadyExistsException.class)
                .hasMessageContaining("already exists");
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
            PageDTO pageDTO = new PageDTO(10, 0);
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
            PageDTO pageDTO = new PageDTO(10, 0);
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
            PageDTO pageDTO = new PageDTO(10, 0);
            AdminResearchGroupFilterDTO filterDTO = new AdminResearchGroupFilterDTO(List.of(ResearchGroupState.ACTIVE), "Test");
            SortDTO sortDTO = new SortDTO("name", SortDTO.Direction.ASC);

            ResearchGroupAdminDTO adminDTO = new ResearchGroupAdminDTO(
                TEST_RESEARCH_GROUP_ID,
                "Test Group",
                "Prof. Test",
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
