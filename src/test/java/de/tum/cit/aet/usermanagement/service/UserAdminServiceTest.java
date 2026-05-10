package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.retention.UserRetentionService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.CreateUserDTO;
import de.tum.cit.aet.usermanagement.dto.ImportUserDTO;
import de.tum.cit.aet.usermanagement.dto.KeycloakUserDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserAdminServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    KeycloakUserService keycloakUserService;

    @Mock
    UserService userService;

    @Mock
    UserRetentionService userRetentionService;

    @Mock
    CurrentUserService currentUserService;

    @InjectMocks
    UserAdminService userAdminService;

    @Test
    void shouldCreateKeycloakUserThenSyncDb() {
        UUID newId = UUID.randomUUID();
        when(keycloakUserService.createUserWithPassword(eq("a@b.com"), eq("Alice"), eq("Apple"), eq("hunter2!Long"))).thenReturn(newId);
        User user = new User();
        user.setUserId(newId);
        when(userService.upsertUser(eq(newId.toString()), eq("a@b.com"), eq("Alice"), eq("Apple"))).thenReturn(user);
        when(userRepository.findById(newId)).thenReturn(Optional.of(user));

        UUID created = userAdminService.create(
            new CreateUserDTO("Alice", "Apple", "a@b.com", "hunter2!Long", null, null, null, null, null, null, null, null)
        );

        assertThat(created).isEqualTo(newId);
        verify(keycloakUserService).createUserWithPassword("a@b.com", "Alice", "Apple", "hunter2!Long");
        verify(userService).upsertUser(newId.toString(), "a@b.com", "Alice", "Apple");
    }

    @Test
    void shouldImportExistingKeycloakUser() {
        UUID kcId = UUID.randomUUID();
        when(keycloakUserService.findKeycloakUserById(kcId)).thenReturn(
            Optional.of(new KeycloakUserDTO(kcId, "alice", "Alice", "Apple", "a@b.com", null))
        );
        User user = new User();
        user.setUserId(kcId);
        when(userService.upsertUser(eq(kcId.toString()), eq("a@b.com"), eq("Alice"), eq("Apple"))).thenReturn(user);

        UUID imported = userAdminService.importFromKeycloak(new ImportUserDTO(kcId));

        assertThat(imported).isEqualTo(kcId);
    }

    @Test
    void shouldRejectImportWhenKeycloakUuidMissing() {
        UUID kcId = UUID.randomUUID();
        when(keycloakUserService.findKeycloakUserById(kcId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAdminService.importFromKeycloak(new ImportUserDTO(kcId))).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void shouldRejectSelfDelete() {
        UUID adminId = UUID.randomUUID();
        when(currentUserService.getUserId()).thenReturn(adminId);

        assertThatThrownBy(() -> userAdminService.delete(adminId)).isInstanceOf(OperationNotAllowedException.class);
        verifyNoInteractions(keycloakUserService);
        verifyNoInteractions(userRetentionService);
    }

    @Test
    void shouldDeleteFromKeycloakThenAnonymiseDb() {
        UUID adminId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        when(currentUserService.getUserId()).thenReturn(adminId);

        userAdminService.delete(targetId);

        verify(keycloakUserService).deleteUser(targetId);
        verify(userRetentionService).deleteUserByAdmin(targetId);
    }

    @Test
    void shouldDelegateListingToRepositoryWithNormalizedSearchAndNullableFilters() {
        var pageDto = new de.tum.cit.aet.core.dto.PageDTO(25, 0);
        var sortDto = new de.tum.cit.aet.core.dto.SortDTO("firstName", de.tum.cit.aet.core.dto.SortDTO.Direction.ASC);
        org.springframework.data.domain.Page<de.tum.cit.aet.usermanagement.dto.AdminUserOverviewDTO> emptyPage =
            org.springframework.data.domain.Page.empty();
        org.mockito.Mockito.when(
            userRepository.findAllUsersForAdmin(
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.any()
            )
        ).thenReturn(emptyPage);

        var result = userAdminService.getAllUsersForAdmin(pageDto, sortDto, java.util.List.of(), java.util.List.of(), "  alice  ");

        assertThat(result).isSameAs(emptyPage);
        org.mockito.Mockito.verify(userRepository).findAllUsersForAdmin(
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void shouldPassThroughRolesAndResearchGroupsWhenFiltersProvided() {
        var pageDto = new de.tum.cit.aet.core.dto.PageDTO(25, 0);
        var sortDto = new de.tum.cit.aet.core.dto.SortDTO("firstName", de.tum.cit.aet.core.dto.SortDTO.Direction.ASC);
        var roles = java.util.List.of(de.tum.cit.aet.usermanagement.constants.UserRole.PROFESSOR);
        var rgIds = java.util.List.of(java.util.UUID.randomUUID());
        org.springframework.data.domain.Page<de.tum.cit.aet.usermanagement.dto.AdminUserOverviewDTO> emptyPage =
            org.springframework.data.domain.Page.empty();
        org.mockito.Mockito.when(
            userRepository.findAllUsersForAdmin(
                org.mockito.ArgumentMatchers.eq(roles),
                org.mockito.ArgumentMatchers.eq(rgIds),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
            )
        ).thenReturn(emptyPage);

        userAdminService.getAllUsersForAdmin(pageDto, sortDto, roles, rgIds, null);

        org.mockito.Mockito.verify(userRepository).findAllUsersForAdmin(
            org.mockito.ArgumentMatchers.eq(roles),
            org.mockito.ArgumentMatchers.eq(rgIds),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void shouldReturnDetailWithHighestPriorityRoleAndResearchGroup() {
        java.util.UUID id = java.util.UUID.randomUUID();
        java.util.UUID rgId = java.util.UUID.randomUUID();

        var rg = new de.tum.cit.aet.usermanagement.domain.ResearchGroup();
        rg.setResearchGroupId(rgId);
        rg.setName("Test RG");

        var employeeRole = new de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole();
        employeeRole.setRole(de.tum.cit.aet.usermanagement.constants.UserRole.EMPLOYEE);
        var professorRole = new de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole();
        professorRole.setRole(de.tum.cit.aet.usermanagement.constants.UserRole.PROFESSOR);

        var user = new de.tum.cit.aet.usermanagement.domain.User();
        user.setUserId(id);
        user.setFirstName("Alice");
        user.setLastName("Apple");
        user.setEmail("a@b.com");
        user.setResearchGroup(rg);
        user.setResearchGroupRoles(new java.util.HashSet<>(java.util.Set.of(employeeRole, professorRole)));

        org.mockito.Mockito.when(userRepository.findWithResearchGroupRolesByUserId(id)).thenReturn(java.util.Optional.of(user));

        var detail = userAdminService.getUserDetail(id);

        assertThat(detail.userId()).isEqualTo(id);
        assertThat(detail.firstName()).isEqualTo("Alice");
        assertThat(detail.primaryRole()).isEqualTo(de.tum.cit.aet.usermanagement.constants.UserRole.PROFESSOR);
        assertThat(detail.researchGroupId()).isEqualTo(rgId);
        assertThat(detail.researchGroupName()).isEqualTo("Test RG");
    }

    @Test
    void shouldReturnDetailWithNullRoleAndResearchGroupWhenAbsent() {
        java.util.UUID id = java.util.UUID.randomUUID();
        var user = new de.tum.cit.aet.usermanagement.domain.User();
        user.setUserId(id);
        user.setFirstName("Bob");
        user.setLastName("Banana");
        user.setEmail("b@b.com");
        user.setResearchGroup(null);
        user.setResearchGroupRoles(null);
        org.mockito.Mockito.when(userRepository.findWithResearchGroupRolesByUserId(id)).thenReturn(java.util.Optional.of(user));

        var detail = userAdminService.getUserDetail(id);

        assertThat(detail.primaryRole()).isNull();
        assertThat(detail.researchGroupId()).isNull();
        assertThat(detail.researchGroupName()).isNull();
    }

    @Test
    void shouldThrowWhenUserDetailNotFound() {
        java.util.UUID id = java.util.UUID.randomUUID();
        org.mockito.Mockito.when(userRepository.findWithResearchGroupRolesByUserId(id)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> userAdminService.getUserDetail(id)).isInstanceOf(
            de.tum.cit.aet.core.exception.EntityNotFoundException.class
        );
    }

    @Test
    void shouldUpdateAllFieldsWhenProvided() {
        java.util.UUID id = java.util.UUID.randomUUID();
        var user = new de.tum.cit.aet.usermanagement.domain.User();
        user.setUserId(id);
        org.mockito.Mockito.when(userRepository.findById(id)).thenReturn(java.util.Optional.of(user));

        var dto = new de.tum.cit.aet.usermanagement.dto.UpdateUserDTO(
            "Alice",
            "Apple",
            "uni-123",
            "+49 0",
            "FEMALE",
            "DE",
            java.time.LocalDate.of(1990, 1, 1),
            "https://example.com",
            "https://linkedin.com/in/alice",
            "en",
            Boolean.TRUE,
            "avatar.png"
        );

        userAdminService.update(id, dto);

        assertThat(user.getFirstName()).isEqualTo("Alice");
        assertThat(user.getLastName()).isEqualTo("Apple");
        assertThat(user.getUniversityId()).isEqualTo("uni-123");
        assertThat(user.getPhoneNumber()).isEqualTo("+49 0");
        assertThat(user.getGender()).isEqualTo("FEMALE");
        assertThat(user.getNationality()).isEqualTo("DE");
        assertThat(user.getBirthday()).isEqualTo(java.time.LocalDate.of(1990, 1, 1));
        assertThat(user.getWebsite()).isEqualTo("https://example.com");
        assertThat(user.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/alice");
        assertThat(user.getSelectedLanguage()).isEqualTo("en");
        assertThat(user.isAiFeaturesEnabled()).isTrue();
        assertThat(user.getAvatar()).isEqualTo("avatar.png");
        org.mockito.Mockito.verify(userRepository).save(user);
    }

    @Test
    void shouldLeaveFieldsUntouchedWhenUpdateDtoFieldsAreNull() {
        java.util.UUID id = java.util.UUID.randomUUID();
        var user = new de.tum.cit.aet.usermanagement.domain.User();
        user.setUserId(id);
        user.setFirstName("Original");
        user.setLastName("Name");
        org.mockito.Mockito.when(userRepository.findById(id)).thenReturn(java.util.Optional.of(user));

        userAdminService.update(
            id,
            new de.tum.cit.aet.usermanagement.dto.UpdateUserDTO(null, null, null, null, null, null, null, null, null, null, null, null)
        );

        assertThat(user.getFirstName()).isEqualTo("Original");
        assertThat(user.getLastName()).isEqualTo("Name");
        org.mockito.Mockito.verify(userRepository).save(user);
    }

    @Test
    void shouldThrowWhenUpdateTargetNotFound() {
        java.util.UUID id = java.util.UUID.randomUUID();
        org.mockito.Mockito.when(userRepository.findById(id)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() ->
            userAdminService.update(
                id,
                new de.tum.cit.aet.usermanagement.dto.UpdateUserDTO("A", null, null, null, null, null, null, null, null, null, null, null)
            )
        ).isInstanceOf(de.tum.cit.aet.core.exception.EntityNotFoundException.class);
    }

    @Test
    void shouldApplyOptionalCreateFieldsAndSaveWhenAnyProvided() {
        java.util.UUID newId = java.util.UUID.randomUUID();
        var user = new de.tum.cit.aet.usermanagement.domain.User();
        user.setUserId(newId);
        org.mockito.Mockito.when(
            keycloakUserService.createUserWithPassword(
                org.mockito.ArgumentMatchers.eq("a@b.com"),
                org.mockito.ArgumentMatchers.eq("Alice"),
                org.mockito.ArgumentMatchers.eq("Apple"),
                org.mockito.ArgumentMatchers.eq("hunter2!Long")
            )
        ).thenReturn(newId);
        org.mockito.Mockito.when(
            userService.upsertUser(
                org.mockito.ArgumentMatchers.eq(newId.toString()),
                org.mockito.ArgumentMatchers.eq("a@b.com"),
                org.mockito.ArgumentMatchers.eq("Alice"),
                org.mockito.ArgumentMatchers.eq("Apple")
            )
        ).thenReturn(user);
        org.mockito.Mockito.when(userRepository.findById(newId)).thenReturn(java.util.Optional.of(user));

        var dto = new de.tum.cit.aet.usermanagement.dto.CreateUserDTO(
            "Alice",
            "Apple",
            "a@b.com",
            "hunter2!Long",
            "uni-1",
            "+49",
            "FEMALE",
            "DE",
            java.time.LocalDate.of(1995, 5, 5),
            "https://example.com",
            "https://linkedin.com/in/a",
            "en"
        );

        var created = userAdminService.create(dto);

        assertThat(created).isEqualTo(newId);
        assertThat(user.getUniversityId()).isEqualTo("uni-1");
        assertThat(user.getPhoneNumber()).isEqualTo("+49");
        assertThat(user.getGender()).isEqualTo("FEMALE");
        assertThat(user.getNationality()).isEqualTo("DE");
        assertThat(user.getBirthday()).isEqualTo(java.time.LocalDate.of(1995, 5, 5));
        assertThat(user.getWebsite()).isEqualTo("https://example.com");
        assertThat(user.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/a");
        assertThat(user.getSelectedLanguage()).isEqualTo("en");
        org.mockito.Mockito.verify(userRepository).save(user);
    }
}
