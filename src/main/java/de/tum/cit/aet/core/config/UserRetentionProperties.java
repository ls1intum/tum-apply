package de.tum.cit.aet.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "user.retention", ignoreUnknownFields = false)
public class UserRetentionProperties {

    private Integer inactiveDaysBeforeDeletion;

    private Integer daysBeforeApplicantDataDeletion;

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

    public Integer getDaysBeforeApplicantDataDeletion() {
        return daysBeforeApplicantDataDeletion;
    }

    public void setDaysBeforeApplicantDataDeletion(Integer daysBeforeApplicantDataDeletion) {
        this.daysBeforeApplicantDataDeletion = daysBeforeApplicantDataDeletion;
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
}
