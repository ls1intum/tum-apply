package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.retention.UserRetentionService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.AdminUserOverviewDTO;
import de.tum.cit.aet.usermanagement.dto.CreateUserDTO;
import de.tum.cit.aet.usermanagement.dto.ImportUserDTO;
import de.tum.cit.aet.usermanagement.dto.KeycloakUserDTO;
import de.tum.cit.aet.usermanagement.dto.UpdateUserDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;

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
        var pageDto = new PageDTO(25, 0);
        var sortDto = new SortDTO("firstName", SortDTO.Direction.ASC);
        Page<AdminUserOverviewDTO> emptyPage = Page.empty();
        when(userRepository.findAllUsersForAdmin(isNull(), isNull(), anyString(), any())).thenReturn(emptyPage);

        var result = userAdminService.getAllUsersForAdmin(pageDto, sortDto, List.of(), List.of(), "  alice  ");

        assertThat(result).isSameAs(emptyPage);
    }

    @Test
    void shouldPassThroughRolesAndResearchGroupsWhenFiltersProvided() {
        var pageDto = new PageDTO(25, 0);
        var sortDto = new SortDTO("firstName", SortDTO.Direction.ASC);
        var roles = List.of(UserRole.PROFESSOR);
        var rgIds = List.of(UUID.randomUUID());
        Page<AdminUserOverviewDTO> emptyPage = Page.empty();
        when(userRepository.findAllUsersForAdmin(eq(roles), eq(rgIds), any(), any())).thenReturn(emptyPage);

        var result = userAdminService.getAllUsersForAdmin(pageDto, sortDto, roles, rgIds, null);

        assertThat(result).isSameAs(emptyPage);
    }

    @Test
    void shouldReturnDetailWithHighestPriorityRoleAndResearchGroup() {
        UUID id = UUID.randomUUID();
        UUID rgId = UUID.randomUUID();

        var rg = new ResearchGroup();
        rg.setResearchGroupId(rgId);
        rg.setName("Test RG");

        var employeeRole = new UserResearchGroupRole();
        employeeRole.setRole(UserRole.EMPLOYEE);
        var professorRole = new UserResearchGroupRole();
        professorRole.setRole(UserRole.PROFESSOR);

        var user = new User();
        user.setUserId(id);
        user.setFirstName("Alice");
        user.setLastName("Apple");
        user.setEmail("a@b.com");
        user.setResearchGroup(rg);
        user.setResearchGroupRoles(new HashSet<>(Set.of(employeeRole, professorRole)));

        when(userRepository.findWithResearchGroupRolesByUserId(id)).thenReturn(Optional.of(user));

        var detail = userAdminService.getUserDetail(id);

        assertThat(detail.userId()).isEqualTo(id);
        assertThat(detail.firstName()).isEqualTo("Alice");
        assertThat(detail.primaryRole()).isEqualTo(UserRole.PROFESSOR);
        assertThat(detail.researchGroupId()).isEqualTo(rgId);
        assertThat(detail.researchGroupName()).isEqualTo("Test RG");
    }

    @Test
    void shouldReturnDetailWithNullRoleAndResearchGroupWhenAbsent() {
        UUID id = UUID.randomUUID();
        var user = new User();
        user.setUserId(id);
        user.setFirstName("Bob");
        user.setLastName("Banana");
        user.setEmail("b@b.com");
        when(userRepository.findWithResearchGroupRolesByUserId(id)).thenReturn(Optional.of(user));

        var detail = userAdminService.getUserDetail(id);

        assertThat(detail.primaryRole()).isNull();
        assertThat(detail.researchGroupId()).isNull();
        assertThat(detail.researchGroupName()).isNull();
    }

    @Test
    void shouldThrowWhenUserDetailNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findWithResearchGroupRolesByUserId(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAdminService.getUserDetail(id)).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void shouldUpdateAllFieldsWhenProvided() {
        UUID id = UUID.randomUUID();
        var user = new User();
        user.setUserId(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        var dto = new UpdateUserDTO(
            "Alice",
            "Apple",
            "uni-123",
            "+49 0",
            "FEMALE",
            "DE",
            LocalDate.of(1990, 1, 1),
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
        assertThat(user.getBirthday()).isEqualTo(LocalDate.of(1990, 1, 1));
        assertThat(user.getWebsite()).isEqualTo("https://example.com");
        assertThat(user.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/alice");
        assertThat(user.getSelectedLanguage()).isEqualTo("en");
        assertThat(user.isAiFeaturesEnabled()).isTrue();
        assertThat(user.getAvatar()).isEqualTo("avatar.png");
        verify(userRepository).save(user);
    }

    @Test
    void shouldLeaveFieldsUntouchedWhenUpdateDtoFieldsAreNull() {
        UUID id = UUID.randomUUID();
        var user = new User();
        user.setUserId(id);
        user.setFirstName("Original");
        user.setLastName("Name");
        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        userAdminService.update(id, new UpdateUserDTO(null, null, null, null, null, null, null, null, null, null, null, null));

        assertThat(user.getFirstName()).isEqualTo("Original");
        assertThat(user.getLastName()).isEqualTo("Name");
        verify(userRepository).save(user);
    }

    @Test
    void shouldThrowWhenUpdateTargetNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            userAdminService.update(id, new UpdateUserDTO("A", null, null, null, null, null, null, null, null, null, null, null))
        ).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void shouldApplyOptionalCreateFieldsAndSaveWhenAnyProvided() {
        UUID newId = UUID.randomUUID();
        var user = new User();
        user.setUserId(newId);
        when(
            keycloakUserService.createUserWithPassword(eq("a@b.com"), eq("Alice"), eq("Apple"), eq("hunter2!Long"))
        ).thenReturn(newId);
        when(
            userService.upsertUser(eq(newId.toString()), eq("a@b.com"), eq("Alice"), eq("Apple"))
        ).thenReturn(user);
        when(userRepository.findById(newId)).thenReturn(Optional.of(user));

        var dto = new CreateUserDTO(
            "Alice",
            "Apple",
            "a@b.com",
            "hunter2!Long",
            "uni-1",
            "+49",
            "FEMALE",
            "DE",
            LocalDate.of(1995, 5, 5),
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
        assertThat(user.getBirthday()).isEqualTo(LocalDate.of(1995, 5, 5));
        assertThat(user.getWebsite()).isEqualTo("https://example.com");
        assertThat(user.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/a");
        assertThat(user.getSelectedLanguage()).isEqualTo("en");
        verify(userRepository).save(user);
    }
}
