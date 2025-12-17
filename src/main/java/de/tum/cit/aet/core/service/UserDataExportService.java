package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.dto.exportdata.UserDataExportDTO;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDataExportService {

    @Transactional(readOnly = true)
    public UserDataExportDTO exportUserData(UUID userId) {
        // Implementation to gather user data and return as UserDataExportDTO
        return null; // Placeholder
    }
}
