package de.tum.cit.aet.job.constants;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LocalizedEnumTest {

    @Test
    void shouldReturnGermanWhenLangIsDe() {
        assertThat(SubjectArea.COMPUTER_SCIENCE.correctLanguageValue("de")).isEqualTo("Informatik");
        assertThat(FundingType.RESEARCH_GRANT.correctLanguageValue("de")).isEqualTo("Forschungsstipendium");
    }

    @ParameterizedTest
    @ValueSource(strings = { "DE", "De", "dE", "de-DE", "de-AT", "de_DE" })
    void shouldReturnGermanWhenLangStartsWithDeIgnoringCase(String lang) {
        assertThat(SubjectArea.COMPUTER_SCIENCE.correctLanguageValue(lang)).isEqualTo("Informatik");
        assertThat(FundingType.RESEARCH_GRANT.correctLanguageValue(lang)).isEqualTo("Forschungsstipendium");
    }

    @Test
    void shouldReturnEnglishWhenLangIsEn() {
        assertThat(SubjectArea.COMPUTER_SCIENCE.correctLanguageValue("en")).isEqualTo("Computer Science");
        assertThat(FundingType.RESEARCH_GRANT.correctLanguageValue("en")).isEqualTo("Research Grant");
    }

    @ParameterizedTest
    @ValueSource(strings = { "en-US", "fr", "" })
    void shouldFallBackToEnglishWhenLangIsNotGerman(String lang) {
        assertThat(SubjectArea.COMPUTER_SCIENCE.correctLanguageValue(lang)).isEqualTo("Computer Science");
        assertThat(FundingType.RESEARCH_GRANT.correctLanguageValue(lang)).isEqualTo("Research Grant");
    }

    @Test
    void shouldFallBackToEnglishWhenLangIsNull() {
        assertThat(SubjectArea.COMPUTER_SCIENCE.correctLanguageValue(null)).isEqualTo("Computer Science");
        assertThat(FundingType.RESEARCH_GRANT.correctLanguageValue(null)).isEqualTo("Research Grant");
    }
}
