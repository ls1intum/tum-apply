package de.tum.cit.aet.job.domain;

import de.tum.cit.aet.job.constants.SubjectArea;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persists {@link SubjectArea} enum values as strings while remaining tolerant
 * when reading legacy database values.
 *
 * We intentionally use a converter instead of {@code @Enumerated(EnumType.STRING)}
 * because older local databases and seed states may still contain historic
 * values such as "CS" or "Informatics". Those values must keep working until
 * every environment has been migrated or re-seeded with the canonical enum
 * names.
 */
@Converter
public class SubjectAreaConverter implements AttributeConverter<SubjectArea, String> {

    @Override
    public String convertToDatabaseColumn(SubjectArea attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public SubjectArea convertToEntityAttribute(String dbData) {
        return SubjectArea.fromValue(dbData);
    }
}
