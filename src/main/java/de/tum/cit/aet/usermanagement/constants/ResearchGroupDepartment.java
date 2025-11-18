package de.tum.cit.aet.usermanagement.constants;

import java.util.stream.Collectors;

import java.util.Arrays;

import java.util.List;

public enum ResearchGroupDepartment {
    MATHEMATICS("Mathematics", ResearchGroupSchool.CIT),
    INFORMATICS("Computer Engineering", ResearchGroupSchool.CIT),
    ELECTRICAL_ENGINEERING("Computer Science", ResearchGroupSchool.CIT),
    INFORMATION_TECHNOLOGY("Electrical Engineering", ResearchGroupSchool.CIT),

    AEROSPACE_AND_GEODESY("Aerospace & Geodesy", ResearchGroupSchool.ED),
    ARCHITECTURE("Architecture", ResearchGroupSchool.ED),
    CIVIL_AND_ENVIRONMENTAL_ENGINEERING("Civil and Environmental Engineering", ResearchGroupSchool.ED),
    ENERGY_AND_PROCESS_ENGINEERING("Energy and Process Engineering", ResearchGroupSchool.ED),
    MATERIALS_ENGINEERING("Materials Engineering", ResearchGroupSchool.ED),
    MECHANICAL_ENGINEERING("Mechanical Engineering", ResearchGroupSchool.ED),
    MOBILITY_SYSTEMS_ENGINEERING("Mobility Systems Engineering", ResearchGroupSchool.ED),

    BIOSCIENCES("Biosciences", ResearchGroupSchool.NAT),
    CHEMISTRY("Chemistry", ResearchGroupSchool.NAT),
    PHYSICS("Physics", ResearchGroupSchool.NAT),

    MOLECULAR_LIFE_SCIENCES("Molecular Life Sciences", ResearchGroupSchool.LS),
    LIFE_SCIENCE_SYSTEMS("Life Science Systems", ResearchGroupSchool.LS),
    LIFE_SCIENCE_ENGINEERING("Life Science Engineering", ResearchGroupSchool.LS),

    HEALTH_AND_SPORT_SCIENCES("Health and Sport Sciences", ResearchGroupSchool.MH),
    CLINICAL_MEDICINE("Clinical Medicine", ResearchGroupSchool.MH),
    PRECLINICAL_MEDICINE("Preclinical Medicine", ResearchGroupSchool.MH),

    ECONOMICS_AND_POLICY("Economics and Policy", ResearchGroupSchool.MGT),
    FINANCE_AND_ACCOUNTING("Finance and Accounting", ResearchGroupSchool.MGT),
    INNOVATION_AND_ENTREPRENEURSHIP("Innovation and Entrepreneurship", ResearchGroupSchool.MGT),
    MARKETING_STRATEGY_AND_LEADERSHIP("Marketing, Strategy and Leadership", ResearchGroupSchool.MGT),
    OPERATIONS_AND_TECHNOLOGY("Operations and Technology", ResearchGroupSchool.MGT),

    SCIENCE_TECHNOLOGY_AND_SOCIETY("Science, Technology and Society", ResearchGroupSchool.SOT),
    GOVERNANCE("Governance", ResearchGroupSchool.SOT),
    EDUCATIONAL_SCIENCES("Educational Sciences", ResearchGroupSchool.SOT);

    private final String displayName;
    private final ResearchGroupSchool school;

    private ResearchGroupDepartment(String displayName, ResearchGroupSchool school) {
        this.displayName = displayName;
        this.school = school;
    }

    public String getDisplayName() {
        return displayName;
    }

    public ResearchGroupSchool getSchool() {
        return school;
    }

    public static List<ResearchGroupDepartment> getDepartmentsBySchool(ResearchGroupSchool school) {
        return Arrays.stream(ResearchGroupDepartment.values())
                .filter(department -> department.getSchool().equals(school))
                .collect(Collectors.toList());
    }
}
