package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserDataExportDTO(
    UserProfileExportDTO profile,
    List<UserSettingDTO> settings,
    List<EmailSettingDTO> emailSettings,
    ApplicantDataExportDTO applicantData, // Null if not an applicant
    StaffDataDTO staffData // Null if not staff
) {}
