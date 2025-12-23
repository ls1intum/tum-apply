package de.tum.cit.aet.evaluation.service;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.core.util.FileUtil;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ApplicationEvaluationServiceTest {

    @Nested
    class SanitizeFilename {

        @Test
        void returnsFileWhenNullOrBlank() {
            assertThat(FileUtil.sanitizeFilename(null)).isEqualTo("file");
            assertThat(FileUtil.sanitizeFilename("   ")).isEqualTo("file");
        }

        @Test
        void replacesIllegalCharacters() {
            assertThat(FileUtil.sanitizeFilename("abc/<>def")).isEqualTo("abc_def");
            assertThat(FileUtil.sanitizeFilename("name:with*illegal?chars")).isEqualTo("name_with_illegal_chars");
        }

        @Test
        void truncatesLongFilenames() {
            String longName = "a".repeat(200);
            String result = FileUtil.sanitizeFilename(longName);
            assertThat(result.length()).isEqualTo(120);
        }

        @Test
        void returnsFileIfCleanedBecomesEmpty() {
            assertThat(FileUtil.sanitizeFilename("////")).isEqualTo("_");
        }

        @Test
        void keepsValidNames() {
            assertThat(FileUtil.sanitizeFilename("normal_name")).isEqualTo("normal_name");
        }
    }
}
