/**
 * Configuration properties for applicant data retention settings.
 *
 * <p>Maps properties prefixed with {@code applicant.retention} from the application
 * configuration into this class. Unknown fields are not allowed to ensure strict
 * configuration validation.</p>
 */
package de.tum.cit.aet.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "applicant.retention", ignoreUnknownFields = false)
public class ApplicantRetentionProperties {

    private Integer daysBeforeDeletion;

    private Boolean enabled;

    private Boolean dryRun;

    private Integer batchSize;

    private Integer maxRuntimeMinutes;

    private String cron;
}
