package de.tum.cit.aet.usermanagement.constants;

public enum ResearchGroupDepartment {
    MATHEMATICS("Mathematics"),
    INFORMATICS("Informatics"),
    ELECTRICAL_ENGINEERING("Electrical Engineering"),
    INFORMATION_TECHNOLOGY("Information Technology");

    private final String displayName;

    private ResearchGroupDepartment(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
