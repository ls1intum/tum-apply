package de.tum.cit.aet.usermanagement.constants;

public enum ResearchGroupSchool {
    CIT("School of Computation, Information and Technology"),
    ED("School of Engineering and Design"),
    NAT("School of Natural Sciences"),
    LS("School of Life Sciences"),
    MH("School of Medicine and Health"),
    MGT("School of Management"),
    SOT("School of Social Sciences and Technology");

    private final String displayName;

    ResearchGroupSchool(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
