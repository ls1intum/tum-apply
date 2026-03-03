package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.core.dto.exportdata.UserProfileExportDTO;
import de.tum.cit.aet.core.dto.exportdata.UserSettingDTO;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserSettingsExportProvider implements UserDataSectionProvider {

    private final UserSettingRepository userSettingRepository;
    private final EmailSettingRepository emailSettingRepository;

    @Override
    public void contribute(ExportContext context, UserDataExportBuilder builder) {
        builder.withProfile(buildProfile(context)).withUserSettings(getUserSettings(context)).withEmailSettings(getEmailSettings(context));
    }

    private UserProfileExportDTO buildProfile(ExportContext context) {
        return new UserProfileExportDTO(
            context.user().getFirstName(),
            context.user().getLastName(),
            context.user().getEmail(),
            context.user().getGender(),
            context.user().getNationality(),
            context.user().getBirthday()
        );
    }

    private List<UserSettingDTO> getUserSettings(ExportContext context) {
        return userSettingRepository
            .findAllByIdUserId(context.user().getUserId())
            .stream()
            .map(setting -> new UserSettingDTO(setting.getId().getSettingKey(), setting.getValue()))
            .toList();
    }

    private List<EmailSettingDTO> getEmailSettings(ExportContext context) {
        return emailSettingRepository
            .findAllByUser(context.user())
            .stream()
            .map(setting -> new EmailSettingDTO(setting.getEmailType(), setting.isEnabled()))
            .toList();
    }
}
