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
}
