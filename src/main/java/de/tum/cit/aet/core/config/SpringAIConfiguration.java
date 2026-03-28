package de.tum.cit.aet.core.config;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.azure.openai.AzureOpenAiChatModel;
import org.springframework.ai.azure.openai.AzureOpenAiChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Configuration for Spring AI chat clients.
 * This configuration is enabled when either Atlas or Hyperion modules are enabled.
 * Manual configuration without auto-configuration.
 */
@Configuration
@Profile("!openapi")
public class SpringAIConfiguration {

    private static final Logger log = LoggerFactory.getLogger(SpringAIConfiguration.class);

    /**
     * Default Chat Client for AI features.
     * Uses the manually configured Azure OpenAI model if available.
     *
     * <p>Clears the {@code stop} sequences on Azure OpenAI models to avoid
     * "Unsupported parameter: 'stop'" errors with reasoning models (e.g., gpt-5-mini)
     * that do not support the {@code stop} parameter.</p>
     *
     * @param chatModels chat models that can be used (optional)
     * @return a configured ChatClient with default options, or null if model is not available
     */
    @Bean
    public ChatClient chatClient(List<ChatModel> chatModels) {
        if (chatModels == null || chatModels.isEmpty()) {
            return null;
        }
        for (ChatModel model : chatModels) {
            log.info(
                "Found Chat Model: {} with temperature: {}",
                model.getDefaultOptions().getModel(),
                model.getDefaultOptions().getTemperature()
            );

            // Reasoning models (e.g., gpt-5-mini) do not support the 'stop' parameter.
            // Spring AI 2.0 may include it by default, causing 400 errors from the API.
            if (model instanceof AzureOpenAiChatModel azureModel) {
                AzureOpenAiChatOptions azureOptions = azureModel.getDefaultOptions();
                azureOptions.setStop(null);
                azureOptions.setStopSequences(null);
            }
        }
        ChatModel chatModel = chatModels.getFirst(); // Use the first available model

        return ChatClient.builder(chatModel).build();
    }
}
