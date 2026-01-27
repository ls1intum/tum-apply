/**
 * Configuration properties for applicant data retention settings.
 *
 * <p>Maps properties prefixed with {@code applicant.retention} from the application
 * configuration into this class. Unknown fields are not allowed to ensure strict
 * configuration validation.</p>
 */
package de.tum.cit.aet.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "applicant.retention", ignoreUnknownFields = false)
public class ApplicantRetentionProperties {

    private Integer daysBeforeDeletion;

    private Boolean enabled;

    private Boolean dryRun;

    private Integer batchSize;

    private Integer maxRuntimeMinutes;

    public Integer getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(Integer batchSize) {
        this.batchSize = batchSize;
    }

    public Integer getDaysBeforeDeletion() {
        return daysBeforeDeletion;
    }

    public void setDaysBeforeDeletion(Integer daysBeforeDeletion) {
        this.daysBeforeDeletion = daysBeforeDeletion;
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

    public Integer getMaxRuntimeMinutes() {
        return maxRuntimeMinutes;
    }

    public void setMaxRuntimeMinutes(Integer maxRuntimeMinutes) {
        this.maxRuntimeMinutes = maxRuntimeMinutes;
    }
}
