package de.tum.cit.aet.job.constants;

import java.util.*;
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
    COMPUTER_SCIENCE("Computer Science", "Informatik"),
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

    SubjectArea(String englishValue, String germanValue) {
        this.englishValue = englishValue;
        this.germanValue = germanValue;
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
                Arrays.stream(new String[] { subjectArea.name(), subjectArea.englishValue, subjectArea.germanValue })
                    .filter(Objects::nonNull)
                    .map(value -> value.toLowerCase(Locale.ROOT))
                    .anyMatch(value -> value.contains(normalizedQuery))
            )
            .toList();
    }

    public String correctLanguageValue(String lang) {
        return "de".equalsIgnoreCase(lang) ? germanValue : englishValue;
    }
}
