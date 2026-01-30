package de.tum.cit.aet.core.config;

import java.util.UUID;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for user retention and scheduled cleanup behavior.
 * <p>
 * Includes settings for inactivity thresholds, applicant data deletion timing,
 * job execution parameters (cron, batch size, max runtime), and placeholders for
 * representing deleted users (ID, email, names, language). Supports enabling/disabling
 * the feature and running in dry-run mode.
 */
@Data
@ConfigurationProperties(prefix = "user.retention", ignoreUnknownFields = false)
public class UserRetentionProperties {

    private Integer inactiveDaysBeforeDeletion;

    private Integer daysBeforeApplicantDataDeletion;

    private Boolean enabled;

    private Boolean dryRun;

    private Integer batchSize;

    private Integer maxRuntimeMinutes;

    private String cron;

    private UUID deletedUserId;

    private String deletedUserEmail;

    private String deletedUserFirstName;

    private String deletedUserLastName;

    private String deletedUserLanguage;
}
