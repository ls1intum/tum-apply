package de.tum.cit.aet.evaluation.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * The client will ask the server for a list of possible reject reasons.
 * The supervisor can use and adapt those to their needs.
 * This method is chosen because lateron instead of an enum a database can be used
 * and each chair can implement custom Reject Reason Texts.
 */

@Getter
@AllArgsConstructor
public enum RejectReason {
    FAILED_APPLICANT_REQUIREMENTS("FAILED_APPLICANT_REQUIREMENTS"),
    POSITION_ALREADY_FILLED("POSITION_ALREADY_FILLED"),
    NOT_SUFFICIENT_GRADES("NOT_SUFFICIENT_GRADES"),
    STRONGER_CANDIDATES_SELECTED("STRONGER_CANDIDATES_SELECTED"),
    LACK_OF_RESEARCH_EXPERIENCE("LACK_OF_RESEARCH_EXPERIENCE");

    private String value;

    public String getStandardText(String languageKey) {
        return "Not yet implemented";
    }
}
