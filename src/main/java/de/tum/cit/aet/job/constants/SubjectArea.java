package de.tum.cit.aet.job.constants;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.Getter;

@Getter
public enum SubjectArea {
    AEROSPACE_ENGINEERING("Aerospace Engineering", "Luft- und Raumfahrttechnik"),
    AGRICULTURAL_ENGINEERING("Agricultural Engineering", "Agrartechnik"),
    ARCHITECTURE("Architecture", "Architektur"),
    ART_HISTORY("Art History", "Kunstgeschichte"),
    AUTOMOTIVE_ENGINEERING("Automotive Engineering", "Fahrzeugtechnik"),
    BIOENGINEERING("Bioengineering", "Bioingenieurwesen"),
    BIOLOGY("Biology", "Biologie"),
    BIOTECHNOLOGY("Biotechnology", "Biotechnologie"),
    CHEMISTRY("Chemistry", "Chemie"),
    COMPUTER_ENGINEERING("Computer Engineering", "Computertechnik"),
    COMPUTER_SCIENCE("Computer Science", "Informatik", "Informatics", "CS"),
    DATA_SCIENCE("Data Science", "Datenwissenschaft"),
    ECONOMICS("Economics", "Wirtschaftswissenschaften"),
    EDUCATION_TECHNOLOGY("Education Technology", "Bildungstechnologie"),
    ELECTRICAL_ENGINEERING("Electrical Engineering", "Elektrotechnik"),
    ENVIRONMENTAL_BIOLOGY("Environmental Biology", "Umweltbiologie"),
    ENVIRONMENTAL_CHEMISTRY("Environmental Chemistry", "Umweltchemie"),
    ENVIRONMENTAL_ENGINEERING("Environmental Engineering", "Umwelttechnik"),
    ENVIRONMENTAL_SCIENCE("Environmental Science", "Umweltwissenschaften"),
    FINANCIAL_ENGINEERING("Financial Engineering", "Finanztechnik"),
    FOOD_TECHNOLOGY("Food Technology", "Lebensmitteltechnologie"),
    GEOLOGY("Geology", "Geologie"),
    GEOSCIENCES("Geosciences", "Geowissenschaften"),
    INDUSTRIAL_ENGINEERING("Industrial Engineering", "Wirtschaftsingenieurwesen"),
    INFORMATION_SYSTEMS("Information Systems", "Wirtschaftsinformatik"),
    LINGUISTICS("Linguistics", "Linguistik"),
    MARINE_BIOLOGY("Marine Biology", "Meeresbiologie"),
    MATERIALS_SCIENCE("Materials Science", "Materialwissenschaften"),
    MATHEMATICS("Mathematics", "Mathematik"),
    MECHANICAL_ENGINEERING("Mechanical Engineering", "Maschinenbau"),
    MEDICAL_INFORMATICS("Medical Informatics", "Medizinische Informatik"),
    NEUROSCIENCE("Neuroscience", "Neurowissenschaften"),
    PHILOSOPHY("Philosophy", "Philosophie"),
    PHYSICS("Physics", "Physik"),
    PSYCHOLOGY("Psychology", "Psychologie"),
    SOFTWARE_ENGINEERING("Software Engineering", "Softwaretechnik"),
    SPORTS_SCIENCE("Sports Science", "Sportwissenschaft"),
    TELECOMMUNICATIONS("Telecommunications", "Telekommunikation"),
    URBAN_PLANNING("Urban Planning", "Stadtplanung");

    private final String englishValue;
    private final String germanValue;
    private final Set<String> aliases;

    SubjectArea(String englishValue, String germanValue, String... aliases) {
        this.englishValue = englishValue;
        this.germanValue = germanValue;
        this.aliases = Set.of(aliases);
    }

    private static final Map<String, SubjectArea> LOOKUP = Arrays.stream(values())
        .flatMap(subjectArea ->
            Stream.concat(
                Stream.of(subjectArea.name(), subjectArea.englishValue, subjectArea.germanValue),
                subjectArea.aliases.stream()
            ).map(alias -> Map.entry(normalize(alias), subjectArea))
        )
        .collect(Collectors.toUnmodifiableMap(Map.Entry::getKey, Map.Entry::getValue, (first, second) -> first));

    public static SubjectArea fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LOOKUP.get(normalize(value));
    }

    /**
     * Finds all subject areas whose enum name or localized labels match the given search query.
     *
     * @param query user-provided search term
     * @return matching subject areas, or an empty list if the query is blank
     */
    public static List<SubjectArea> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String normalizedQuery = query.trim().toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
            .filter(subjectArea ->
                Stream.concat(
                    Stream.of(subjectArea.name(), subjectArea.englishValue, subjectArea.germanValue),
                    subjectArea.aliases.stream()
                )
                    .filter(Objects::nonNull)
                    .map(value -> value.toLowerCase(Locale.ROOT))
                    .anyMatch(value -> value.contains(normalizedQuery))
            )
            .toList();
    }

    /**
     * Returns all persisted string representations that may exist for this subject area.
     * This includes the canonical enum name as well as historic English, German, and alias values
     * that may still be present in older databases.
     *
     * @return all accepted persisted values for this subject area
     */
    public Set<String> persistedValues() {
        return Stream.concat(Stream.of(name(), englishValue, germanValue), aliases.stream()).collect(Collectors.toUnmodifiableSet());
    }

    /**
     * Expands the given subject areas into all persisted string values that should match in the database.
     *
     * @param subjectAreas selected subject area enums
     * @return all canonical and legacy persisted values for the given enums
     */
    public static List<String> persistedValuesFor(List<SubjectArea> subjectAreas) {
        if (subjectAreas == null || subjectAreas.isEmpty()) {
            return List.of();
        }

        return subjectAreas
            .stream()
            .filter(Objects::nonNull)
            .flatMap(subjectArea -> subjectArea.persistedValues().stream())
            .distinct()
            .toList();
    }

    public String correctLanguageValue(String lang) {
        return "de".equalsIgnoreCase(lang) ? germanValue : englishValue;
    }

    private static String normalize(String value) {
        return value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
    }
}
