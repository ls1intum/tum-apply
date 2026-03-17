package de.tum.cit.aet.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.ai.ComplianceCategory;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ComplianceIssueDTO(String id, ComplianceCategory category, String text, String article, String explanation, String action) {}
