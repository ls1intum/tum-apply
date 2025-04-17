package de.tum.cit.aet.job.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum CustomFieldType {
    FREE_TEXT("FREE_TEXT"),
    SINGLE_CHOICE("SINGLE_CHOICE"),
    MULTIPLE_CHOICE("MULTIPLE_CHOICE"),
    FILE_UPLOAD("FILE_UPLOAD");

    private final String value;
}
