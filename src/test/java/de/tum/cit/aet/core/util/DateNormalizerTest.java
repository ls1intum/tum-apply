package de.tum.cit.aet.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DateNormalizerTest {

    @Test
    void parsesIsoDate() {
        assertThat(DateNormalizer.normalize("1990-01-01")).isEqualTo("1990-01-01");
    }

    @Test
    void parsesGermanDottedDate() {
        assertThat(DateNormalizer.normalize("01.01.1990")).isEqualTo("1990-01-01");
        assertThat(DateNormalizer.normalize("31.12.1985")).isEqualTo("1985-12-31");
    }

    @Test
    void parsesUsSlashDate() {
        assertThat(DateNormalizer.normalize("01/15/1990")).isEqualTo("1990-01-15");
    }

    @Test
    void parsesEuSlashDate() {
        // Day > 12 disambiguates dd/MM/yyyy from MM/dd/yyyy
        assertThat(DateNormalizer.normalize("15/01/1990")).isEqualTo("1990-01-15");
    }

    @Test
    void parsesTwoDigitYearWithPivotAt30() {
        assertThat(DateNormalizer.normalize("01/01/29")).isEqualTo("2029-01-01");
        assertThat(DateNormalizer.normalize("01/01/30")).isEqualTo("1930-01-01");
        assertThat(DateNormalizer.normalize("01/01/99")).isEqualTo("1999-01-01");
    }

    @Test
    void parsesEnglishMonthName() {
        assertThat(DateNormalizer.normalize("January 1, 1990")).isEqualTo("1990-01-01");
        assertThat(DateNormalizer.normalize("Jan 1, 1990")).isEqualTo("1990-01-01");
    }

    @Test
    void parsesEnglishMonthNameWithOrdinalSuffix() {
        assertThat(DateNormalizer.normalize("Jan 1st, 1990")).isEqualTo("1990-01-01");
        assertThat(DateNormalizer.normalize("January 2nd, 1990")).isEqualTo("1990-01-02");
        assertThat(DateNormalizer.normalize("Mar 3rd, 1990")).isEqualTo("1990-03-03");
        assertThat(DateNormalizer.normalize("April 4th, 1990")).isEqualTo("1990-04-04");
    }

    @Test
    void trimsWhitespace() {
        assertThat(DateNormalizer.normalize("  1990-01-01  ")).isEqualTo("1990-01-01");
    }

    @Test
    void returnsNullForUnparseableInput() {
        assertThat(DateNormalizer.normalize("not a date")).isNull();
        assertThat(DateNormalizer.normalize("31/02/1990")).isNull();
        assertThat(DateNormalizer.normalize("13/13/1990")).isNull();
    }

    @Test
    void returnsNullForEmptyOrNullInput() {
        assertThat(DateNormalizer.normalize(null)).isNull();
        assertThat(DateNormalizer.normalize("")).isNull();
        assertThat(DateNormalizer.normalize("   ")).isNull();
    }

    @Test
    void rejectsImplausibleYear() {
        assertThat(DateNormalizer.normalize("1899-12-31")).isNull();
        assertThat(DateNormalizer.normalize("3000-01-01")).isNull();
    }
}
