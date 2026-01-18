package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.exception.AiPromptException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PromptLoaderTest {

    private PromptLoader promptLoader;

    @BeforeEach
    void setUp() {
        promptLoader = new PromptLoader();
    }

    @Test
    void getPromptLoadFromTestResources() {
        String promptName = "test-prompt";
        String content = promptLoader.getPrompt(promptName);

        assertThat(content)
            .isNotNull()
            .contains("This is a test prompt");
    }

    @Test
    void getPromptCacheLoadedContent() {
        String promptName = "test-prompt";

        String firstCall = promptLoader.getPrompt(promptName);
        String secondCall = promptLoader.getPrompt(promptName);

        // Verify referential equality (proves it came from the Map, not a new disk read)
        assertThat(firstCall).isSameAs(secondCall);
    }

    @Test
    void getPromptThrowsExceptionIfFileNotFound() {
        String invalidName = "non_existent_file";

        assertThatThrownBy(() -> promptLoader.getPrompt(invalidName))
            .isInstanceOf(AiPromptException.class);
    }
}
