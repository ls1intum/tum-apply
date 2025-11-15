package de.tum.cit.aet.core.constants;

/**
 * Represents the different schools/departments at TUM
 */
public enum School {
    CIT("CIT - School of Computation, Information and Technology");

    private final String displayName;

    School(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
