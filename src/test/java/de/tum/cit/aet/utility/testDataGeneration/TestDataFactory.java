package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.dto.*;
import de.tum.cit.aet.usermanagement.constants.GradingScale;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.dto.ApplicantForApplicationDetailDTO;
import de.tum.cit.aet.usermanagement.dto.UserDTO;
import de.tum.cit.aet.usermanagement.dto.UserForApplicationDetailDTO;

import java.time.LocalDate;
import java.util.UUID;

public final class TestDataFactory {

    private static UserDTO createUserDTO(UUID userId) {
        return new UserDTO(
            userId, "user@example.com", null, "TestFirst", "TestLast",
            "OTHER", "Country", LocalDate.now().minusYears(25),
            "+123", "site.com", "ln.com", "en", null
        );
    }

    private static ApplicantDTO createApplicantDTO(UUID applicantId) {
        return new ApplicantDTO(
            createUserDTO(applicantId), "Street", "00000", "City", "Country",
            "BSc", GradingScale.ONE_TO_FOUR, "1.0", "Uni", "MSc", GradingScale.ONE_TO_FOUR, "1.0", "Uni2"
        );
    }

    public static UpdateApplicationDTO createUpdateApplicationDTO(UUID appId, UUID applicantId, UUID jobId) {
        return new UpdateApplicationDTO(
            appId,
            createApplicantDTO(applicantId),
            LocalDate.now().plusDays(1),
            ApplicationState.SENT,
            "Proj", "Skills", "Motivation"
        );
    }

    public static ApplicationDetailDTO createApplicationDetailDTO(UUID appId, UUID applicantId) {
        UserForApplicationDetailDTO userDetail = new UserForApplicationDetailDTO(
            applicantId, "detail@example.com", null, "Detail Name", "OTHER", "Country", "EN",
            LocalDate.now().minusYears(30), "+456", "site.com", "ln.com"
        );
        ApplicantForApplicationDetailDTO applicantDetail = new ApplicantForApplicationDetailDTO(
            userDetail,
            "BSc", GradingScale.ONE_TO_FOUR, "1.0", "Uni", "MSc", GradingScale.ONE_TO_FOUR, "1.0", "Uni2"
        );
        return new ApplicationDetailDTO(
            appId, applicantDetail, ApplicationState.SENT,
            "Detail Job Title", LocalDate.now(), "Proj", "Skills", "Motivation"
        );
    }
}
