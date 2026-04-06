package de.tum.cit.aet.job.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FundingType implements LocalizedEnum {
    FULLY_FUNDED("Fully Funded", "Vollständig finanziert"),
    PARTIALLY_FUNDED("Partially Funded", "Teilweise finanziert"),
    SCHOLARSHIP("Scholarship", "Stipendium"),
    SELF_FUNDED("Self Funded", "Selbstfinanziert"),
    INDUSTRY_SPONSORED("Industry Sponsored", "Industriegesponsert"),
    GOVERNMENT_FUNDED("Government Funded", "Staatlich finanziert"),
    RESEARCH_GRANT("Research Grant", "Forschungsstipendium");

    private final String englishValue;
    private final String germanValue;
}
