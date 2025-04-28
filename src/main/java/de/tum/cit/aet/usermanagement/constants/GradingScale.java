package de.tum.cit.aet.usermanagement.constants;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum GradingScale {
    ONE_TO_FOUR("1.0 best – 4.0 worst (e.g., Germany)");

    // Future Expansion: Add more grading scales as needed
    /*
    FOUR_POINT("4.0 best – 0.0 worst (e.g., USA, Canada)"),
    LETTER("A best – F worst (e.g., Europe)"),
    PERCENTAGE("100% best – 0% worst (e.g., UK, China, others)"),
    TEN_POINT("10 best – 0 worst (e.g., India, Brazil)");
     */

    private final String description;
}
