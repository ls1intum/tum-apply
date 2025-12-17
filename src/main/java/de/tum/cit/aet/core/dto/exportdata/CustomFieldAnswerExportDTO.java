package de.tum.cit.aet.core.dto.exportdata;

import java.util.List;

public record CustomFieldAnswerExportDTO(String question, List<String> answers) {}
