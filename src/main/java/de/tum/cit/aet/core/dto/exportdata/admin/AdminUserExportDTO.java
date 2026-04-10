package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Flat, re-importable representation of a {@link de.tum.cit.aet.usermanagement.domain.User}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminUserExportDTO(
    UUID userId,
    UUID researchGroupId,
    String email,
    String firstName,
    String lastName,
    String gender,
    String nationality,
    LocalDate birthday,
    String phoneNumber,
    String website,
    String linkedinUrl,
    String selectedLanguage,
    String universityId,
    LocalDateTime lastActivityAt,
    boolean aiFeaturesEnabled,
    LocalDateTime aiConsentedAt,
    List<AdminUserRoleDTO> roles,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
