package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.core.dto.exportdata.ApplicantDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.StaffDataDTO;
import de.tum.cit.aet.core.dto.exportdata.UserDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.UserProfileExportDTO;
import de.tum.cit.aet.core.dto.exportdata.UserSettingDTO;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Builder that aggregates export sections supplied by providers.
 */
public class UserDataExportBuilder {

    private UserProfileExportDTO profile;
    private List<UserSettingDTO> userSettings = new ArrayList<>();
    private List<EmailSettingDTO> emailSettings = new ArrayList<>();
    private ApplicantDataExportDTO applicantData;
    private StaffDataDTO staffData;

    public UserDataExportBuilder withProfile(UserProfileExportDTO profile) {
        this.profile = profile;
        return this;
    }

    public UserDataExportBuilder withUserSettings(List<UserSettingDTO> settings) {
        if (settings != null) {
            this.userSettings = settings;
        }
        return this;
    }

    public UserDataExportBuilder withEmailSettings(List<EmailSettingDTO> settings) {
        if (settings != null) {
            this.emailSettings = settings;
        }
        return this;
    }

    public UserDataExportBuilder withApplicantData(ApplicantDataExportDTO data) {
        this.applicantData = data;
        return this;
    }

    public UserDataExportBuilder withStaffData(StaffDataDTO data) {
        this.staffData = data;
        return this;
    }

    public UserDataExportDTO build() {
        Objects.requireNonNull(profile, "User profile must be provided for export");
        return new UserDataExportDTO(profile, userSettings, emailSettings, applicantData, staffData);
    }
}
