package de.tum.cit.aet.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class DateNormalizerTest {

    @ParameterizedTest(name = "should normalize \"{0}\" to {1}")
    @CsvSource(
        {
            // ISO date
            "1990-01-01,                1990-01-01",
            // German dotted date
            "01.01.1990,                1990-01-01",
            "31.12.1985,                1985-12-31",
            // US slash date (mm/dd/yyyy)
            "01/15/1990,                1990-01-15",
            // EU slash date (dd/MM/yyyy disambiguated by day > 12)
            "15/01/1990,                1990-01-15",
            // Two-digit year with pivot at 30
            "01/01/29,                  2029-01-01",
            "01/01/30,                  1930-01-01",
            "01/01/99,                  1999-01-01",
            // English month names
            "'January 1, 1990',         1990-01-01",
            "'Jan 1, 1990',             1990-01-01",
            // English month names with ordinal suffixes
            "'Jan 1st, 1990',           1990-01-01",
            "'January 2nd, 1990',       1990-01-02",
            "'Mar 3rd, 1990',           1990-03-03",
            "'April 4th, 1990',         1990-04-04",
            // Whitespace trimming
            "'  1990-01-01  ',          1990-01-01",
        }
    )
    void shouldNormalizeValidDates(String input, String expected) {
        assertThat(DateNormalizer.normalize(input)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "should return null for unparseable input \"{0}\"")
    @ValueSource(strings = { "not a date", "31/02/1990", "13/13/1990", "1899-12-31", "3000-01-01" })
    void shouldReturnNullForUnparseableInput(String input) {
        assertThat(DateNormalizer.normalize(input)).isNull();
    }

    @ParameterizedTest(name = "should return null for blank input \"{0}\"")
    @NullAndEmptySource
    @ValueSource(strings = { "   " })
    void shouldReturnNullForEmptyOrNullInput(String input) {
        assertThat(DateNormalizer.normalize(input)).isNull();
    }
}
