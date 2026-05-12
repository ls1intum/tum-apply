package de.tum.cit.aet.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class CountryCodeNormalizerTest {

    @ParameterizedTest(name = "should normalize \"{0}\" to alpha-2 \"{1}\"")
    @CsvSource(
        {
            // Lowercase alpha-2
            "us, us",
            "de, de",
            // Uppercase alpha-2
            "US, us",
            "DE, de",
            // Alpha-3 codes
            "USA, us",
            "DEU, de",
            "ita, it",
            // English country names
            "'United States', us",
            "'united states of america', us",
            "Germany, de",
            "ITALY, it",
            // German country names
            "Deutschland, de",
            "Italien, it",
            // Common aliases
            "UK, gb",
            "'Great Britain', gb",
            // Whitespace handling
            "'  us  ', us",
            "'\tGermany\n', de",
        }
    )
    void shouldReturnAlpha2ForValidInput(String input, String expected) {
        assertThat(CountryCodeNormalizer.normalize(input)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "should return null for unknown input \"{0}\"")
    @ValueSource(strings = { "Atlantis", "xx", "123" })
    void shouldReturnNullForUnknownInput(String input) {
        assertThat(CountryCodeNormalizer.normalize(input)).isNull();
    }

    @ParameterizedTest(name = "should return null for blank input \"{0}\"")
    @NullAndEmptySource
    @ValueSource(strings = { "   " })
    void shouldReturnNullForEmptyOrNullInput(String input) {
        assertThat(CountryCodeNormalizer.normalize(input)).isNull();
    }
}
