package de.tum.cit.aet.core.config;

import java.util.UUID;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for user retention and scheduled cleanup behavior.
 * <p>
 * Includes settings for inactivity thresholds, applicant data deletion timing,
 * job execution parameters (cron, batch size, max runtime), and placeholders for
 * representing deleted users (ID, email, names, language). Supports enabling/disabling
 * the feature and running in dry-run mode.
 */
@ConfigurationProperties(prefix = "user.retention", ignoreUnknownFields = false)
public class UserRetentionProperties {

    private Integer inactiveDaysBeforeDeletion;

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

    public Integer getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(Integer batchSize) {
        this.batchSize = batchSize;
    }

    public Boolean getDryRun() {
        return dryRun;
    }

    public void setDryRun(Boolean dryRun) {
        this.dryRun = dryRun;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Integer getInactiveDaysBeforeDeletion() {
        return inactiveDaysBeforeDeletion;
    }

    public void setInactiveDaysBeforeDeletion(Integer inactiveDaysBeforeDeletion) {
        this.inactiveDaysBeforeDeletion = inactiveDaysBeforeDeletion;
    }

    public Integer getMaxRuntimeMinutes() {
        return maxRuntimeMinutes;
    }

    public void setMaxRuntimeMinutes(Integer maxRuntimeMinutes) {
        this.maxRuntimeMinutes = maxRuntimeMinutes;
    }

    public String getCron() {
        return cron;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }

    public UUID getDeletedUserId() {
        return deletedUserId;
    }

    public void setDeletedUserId(UUID deletedUserId) {
        this.deletedUserId = deletedUserId;
    }

    public String getDeletedUserEmail() {
        return deletedUserEmail;
    }

    public void setDeletedUserEmail(String deletedUserEmail) {
        this.deletedUserEmail = deletedUserEmail;
    }

    public String getDeletedUserFirstName() {
        return deletedUserFirstName;
    }

    public void setDeletedUserFirstName(String deletedUserFirstName) {
        this.deletedUserFirstName = deletedUserFirstName;
    }

    public String getDeletedUserLastName() {
        return deletedUserLastName;
    }

    public void setDeletedUserLastName(String deletedUserLastName) {
        this.deletedUserLastName = deletedUserLastName;
    }

    public String getDeletedUserLanguage() {
        return deletedUserLanguage;
    }

    public void setDeletedUserLanguage(String deletedUserLanguage) {
        this.deletedUserLanguage = deletedUserLanguage;
    }
}
