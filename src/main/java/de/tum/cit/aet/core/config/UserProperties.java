package de.tum.cit.aet.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "user", ignoreUnknownFields = false)
public class UserProperties {

    private final Retention retention = new Retention();

    public Retention getRetention() {
        return retention;
    }

    public static class Retention {

        /**
         * Number of inactive years after which a user is considered inactive.
         */
        private Integer inactiveYears = 2;

        public Integer getInactiveYears() {
            return inactiveYears;
        }

        public void setInactiveYears(Integer inactiveYears) {
            this.inactiveYears = inactiveYears;
        }
    }
}
