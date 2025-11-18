package de.tum.cit.aet.usermanagement.constants;

public enum ResearchGroupDepartment {
    MATHEMATICS("Mathematics"),
    INFORMATICS("Computer Engineering"),
    ELECTRICAL_ENGINEERING("Computer Science"),
    INFORMATION_TECHNOLOGY("Information Technology");

    private final String displayName;

    private ResearchGroupDepartment(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
