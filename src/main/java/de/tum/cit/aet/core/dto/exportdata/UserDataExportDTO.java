package de.tum.cit.aet.core.dto.exportdata;

import com.typesafe.config.Optional;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import java.util.List;

public record UserDataExportDTO(
    UserProfileDTO profile,
    List<UserSettingDTO> settings,
    List<EmailSettingDTO> emailSettings,
    @Optional ApplicantDataDTO applicantData, // Null if not an applicant
    @Optional StaffDataDTO staffData // Null if not staff
) {}
