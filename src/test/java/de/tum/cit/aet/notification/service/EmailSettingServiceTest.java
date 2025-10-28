package de.tum.cit.aet.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailSetting;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmailSettingServiceTest {

    @Mock
    private EmailSettingRepository emailSettingRepository;

    @Mock
    private UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    @InjectMocks
    private EmailSettingService emailSettingService;

    private User user;
    private EmailSetting setting;

    @BeforeEach
    void setup() {
        user = new User();
        user.setUserId(UUID.randomUUID());

        setting = new EmailSetting();
        setting.setUser(user);
        setting.setEmailType(EmailType.APPLICATION_ACCEPTED);

        when(userResearchGroupRoleRepository.findAllByUser(user)).thenReturn(Set.of(new UserResearchGroupRole()));
        when(emailSettingRepository.findAvailableEmailTypesForUser(user)).thenReturn(Set.of(EmailType.APPLICATION_ACCEPTED));
    }

    @Test
    void canNotifyReturnsTrueWhenEnabled() {
        setting.setEnabled(true);

        when(emailSettingRepository.findByUserAndEmailType(user, EmailType.APPLICATION_ACCEPTED)).thenReturn(Optional.of(setting));

        boolean result = emailSettingService.canNotify(EmailType.APPLICATION_ACCEPTED, user);

        assertThat(result).isTrue();
    }

    @Test
    void canNotifyReturnsFalseWhenDisabled() {
        setting.setEnabled(false);

        when(emailSettingRepository.findByUserAndEmailType(user, EmailType.APPLICATION_ACCEPTED)).thenReturn(Optional.of(setting));

        boolean result = emailSettingService.canNotify(EmailType.APPLICATION_ACCEPTED, user);

        assertThat(result).isFalse();
    }

    @Test
    void canNotifyThrowsWhenSettingNotFound() {
        when(emailSettingRepository.findByUserAndEmailType(user, EmailType.APPLICATION_ACCEPTED)).thenReturn(Optional.empty());
        when(emailSettingRepository.findAvailableEmailTypesForUser(user)).thenReturn(Set.of());

        assertThatThrownBy(() -> emailSettingService.canNotify(EmailType.APPLICATION_ACCEPTED, user))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("User " + user.getUserId());
    }
}
