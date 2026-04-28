package de.tum.cit.aet.ai.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CountryCodeNormalizerTest {

    @Test
    void returnsAlpha2ForLowercaseCode() {
        assertThat(CountryCodeNormalizer.normalize("us")).isEqualTo("us");
        assertThat(CountryCodeNormalizer.normalize("de")).isEqualTo("de");
    }

    @Test
    void returnsAlpha2ForUppercaseCode() {
        assertThat(CountryCodeNormalizer.normalize("US")).isEqualTo("us");
        assertThat(CountryCodeNormalizer.normalize("DE")).isEqualTo("de");
    }

    @Test
    void returnsAlpha2ForAlpha3Code() {
        assertThat(CountryCodeNormalizer.normalize("USA")).isEqualTo("us");
        assertThat(CountryCodeNormalizer.normalize("DEU")).isEqualTo("de");
        assertThat(CountryCodeNormalizer.normalize("ita")).isEqualTo("it");
    }

    @Test
    void returnsAlpha2ForEnglishName() {
        assertThat(CountryCodeNormalizer.normalize("United States")).isEqualTo("us");
        assertThat(CountryCodeNormalizer.normalize("united states of america")).isEqualTo("us");
        assertThat(CountryCodeNormalizer.normalize("Germany")).isEqualTo("de");
        assertThat(CountryCodeNormalizer.normalize("ITALY")).isEqualTo("it");
    }

    @Test
    void returnsAlpha2ForGermanName() {
        assertThat(CountryCodeNormalizer.normalize("Deutschland")).isEqualTo("de");
        assertThat(CountryCodeNormalizer.normalize("Italien")).isEqualTo("it");
    }

    @Test
    void returnsAlpha2ForCommonAliases() {
        assertThat(CountryCodeNormalizer.normalize("UK")).isEqualTo("gb");
        assertThat(CountryCodeNormalizer.normalize("Great Britain")).isEqualTo("gb");
    }

    @Test
    void trimsAndIgnoresLeadingTrailingWhitespace() {
        assertThat(CountryCodeNormalizer.normalize("  us  ")).isEqualTo("us");
        assertThat(CountryCodeNormalizer.normalize("\tGermany\n")).isEqualTo("de");
    }

    @Test
    void returnsNullForUnknownInput() {
        assertThat(CountryCodeNormalizer.normalize("Atlantis")).isNull();
        assertThat(CountryCodeNormalizer.normalize("xx")).isNull();
        assertThat(CountryCodeNormalizer.normalize("123")).isNull();
    }

    @Test
    void returnsNullForEmptyOrNullInput() {
        assertThat(CountryCodeNormalizer.normalize(null)).isNull();
        assertThat(CountryCodeNormalizer.normalize("")).isNull();
        assertThat(CountryCodeNormalizer.normalize("   ")).isNull();
    }
}
