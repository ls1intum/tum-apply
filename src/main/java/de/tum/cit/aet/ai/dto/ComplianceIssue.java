package de.tum.cit.aet.ai.dto;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceIssue {

    private String id;
    private String category;
    private String text;
    private String article;
    private String explanation;
    private String action;
    private String language;
}
