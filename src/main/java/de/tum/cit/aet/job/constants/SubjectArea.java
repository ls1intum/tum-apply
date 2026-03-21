package de.tum.cit.aet.job.constants;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SubjectArea implements LocalizedEnum {
    AEROSPACE_ENGINEERING("Aerospace Engineering", "Luft- und Raumfahrttechnik"),
    AGRICULTURAL_ENGINEERING("Agricultural Engineering", "Agrartechnik"),
    AGRICULTURAL_SCIENCE("Agricultural Science", "Agrarwissenschaften"),
    ARCHITECTURE("Architecture", "Architektur"),
    ART_HISTORY("Art History", "Kunstgeschichte"),
    AUTOMOTIVE_ENGINEERING("Automotive Engineering", "Fahrzeugtechnik"),
    BIOENGINEERING("Bioengineering", "Bioingenieurwesen"),
    BIOCHEMISTRY("Biochemistry", "Biochemie"),
    BIOLOGY("Biology", "Biologie"),
    BIOMEDICAL_ENGINEERING("Biomedical Engineering", "Biomedizintechnik"),
    BIOTECHNOLOGY("Biotechnology", "Biotechnologie"),
    CHEMISTRY("Chemistry", "Chemie"),
    COMPUTER_ENGINEERING("Computer Engineering", "Computertechnik"),
    COMPUTER_SCIENCE("Computer Science", "Informatik"),
    COMPUTER_VISION("Computer Vision", "Computer Vision"),
    DATA_SCIENCE("Data Science", "Datenwissenschaft"),
    ECONOMICS("Economics", "Wirtschaftswissenschaften"),
    EDUCATION_TECHNOLOGY("Education Technology", "Bildungstechnologie"),
    ELECTRICAL_ENGINEERING("Electrical Engineering", "Elektrotechnik"),
    ENERGY_SYSTEMS("Energy Systems", "Energiesysteme"),
    ENVIRONMENTAL_BIOLOGY("Environmental Biology", "Umweltbiologie"),
    ENVIRONMENTAL_CHEMISTRY("Environmental Chemistry", "Umweltchemie"),
    ENVIRONMENTAL_ENGINEERING("Environmental Engineering", "Umwelttechnik"),
    ENVIRONMENTAL_LAW("Environmental Law", "Umweltrecht"),
    ENVIRONMENTAL_SCIENCE("Environmental Science", "Umweltwissenschaften"),
    FINANCIAL_ENGINEERING("Financial Engineering", "Finanztechnik"),
    FOOD_TECHNOLOGY("Food Technology", "Lebensmitteltechnologie"),
    GEOLOGY("Geology", "Geologie"),
    GEOSCIENCES("Geosciences", "Geowissenschaften"),
    INDUSTRIAL_ENGINEERING("Industrial Engineering", "Wirtschaftsingenieurwesen"),
    INFORMATION_SYSTEMS("Information Systems", "Wirtschaftsinformatik"),
    LIFE_SCIENCES("Life Sciences", "Lebenswissenschaften"),
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
    STATISTICS("Statistics", "Statistik"),
    TELECOMMUNICATIONS("Telecommunications", "Telekommunikation"),
    URBAN_PLANNING("Urban Planning", "Stadtplanung");

    private final String englishValue;
    private final String germanValue;

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
}
