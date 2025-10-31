package de.tum.cit.aet.evaluation.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ApplicationEvaluationServiceTest {

    private Method sanitizeMethod;

    @BeforeEach
    void setup() throws Exception {
        sanitizeMethod = ApplicationEvaluationService.class.getDeclaredMethod("sanitizeFilename", String.class);
        sanitizeMethod.setAccessible(true);
    }

    @Nested
    class SanitizeFilename {

        private String sanitize(String input) throws Exception {
            return (String) sanitizeMethod.invoke(null, input);
        }

        @Test
        void returnsFileWhenNullOrBlank() throws Exception {
            assertThat(sanitize(null)).isEqualTo("file");
            assertThat(sanitize("   ")).isEqualTo("file");
        }

        @Test
        void replacesIllegalCharacters() throws Exception {
            assertThat(sanitize("abc/<>def")).isEqualTo("abc_def");
            assertThat(sanitize("name:with*illegal?chars")).isEqualTo("name_with_illegal_chars");
        }

        @Test
        void truncatesLongFilenames() throws Exception {
            String longName = "a".repeat(200);
            String result = sanitize(longName);
            assertThat(result.length()).isEqualTo(120);
        }

        @Test
        void returnsFileIfCleanedBecomesEmpty() throws Exception {
            assertThat(sanitize("////")).isEqualTo("_");
        }

        @Test
        void keepsValidNames() throws Exception {
            assertThat(sanitize("normal_name")).isEqualTo("normal_name");
        }
    }
}
