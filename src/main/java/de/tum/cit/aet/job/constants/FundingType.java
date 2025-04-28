package de.tum.cit.aet.job.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FundingType {
    FULLY_FUNDED("FULLY_FUNDED"),
    PARTIALLY_FUNDED("PARTIALLY_FUNDED"),
    SCHOLARSHIP("SCHOLARSHIP"),
    SELF_FUNDED("SELF_FUNDED"),
    INDUSTRY_SPONSORED("INDUSTRY_SPONSORED"),
    GOVERNMENT_FUNDED("GOVERNMENT_FUNDED"),
    RESEARCH_GRANT("RESEARCH_GRANT");

    private final String value;
}
