package de.tum.cit.aet.core.config;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.azure.openai.AzureOpenAiChatModel;
import org.springframework.ai.azure.openai.AzureOpenAiChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import reactor.core.publisher.Flux;

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
     * <p>Wraps Azure OpenAI models in a {@link ReasoningModelSafeChatModel} that strips
     * unsupported parameters ({@code stop}, {@code max_tokens}) before each request.
     * Reasoning models like gpt-5-mini reject these parameters with a 400 error.</p>
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
        }
        ChatModel chatModel = chatModels.getFirst();

        // Wrap Azure models to strip unsupported parameters for reasoning models
        if (chatModel instanceof AzureOpenAiChatModel azureModel) {
            AzureOpenAiChatOptions defaultOptions = azureModel.getDefaultOptions();
            defaultOptions.setStop(null);
            defaultOptions.setStopSequences(null);
            defaultOptions.setMaxTokens(null);
            chatModel = new ReasoningModelSafeChatModel(azureModel);
        }

        return ChatClient.builder(chatModel).build();
    }

    /**
     * Wraps an {@link AzureOpenAiChatModel} to sanitize prompt options before each call,
     * removing parameters that reasoning models (e.g., gpt-5-mini) do not support.
     *
     * <p>Spring AI 2.0 merges default and per-request options internally, which can
     * re-introduce {@code stop} even after clearing it on the default options.
     * This wrapper intercepts every call/stream and strips the problematic fields
     * from the merged options before they reach the Azure SDK.</p>
     */
    private static class ReasoningModelSafeChatModel implements ChatModel {

        private final AzureOpenAiChatModel delegate;

        ReasoningModelSafeChatModel(AzureOpenAiChatModel delegate) {
            this.delegate = delegate;
        }

        @Override
        public ChatResponse call(Prompt prompt) {
            return delegate.call(sanitizePrompt(prompt));
        }

        @Override
        public Flux<ChatResponse> stream(Prompt prompt) {
            return delegate.stream(sanitizePrompt(prompt));
        }

        @Override
        public ChatOptions getDefaultOptions() {
            return delegate.getDefaultOptions();
        }

        /**
         * Strips unsupported parameters from prompt options.
         * Reasoning models reject 'stop' and 'max_tokens' (they only accept 'max_completion_tokens').
         */
        private Prompt sanitizePrompt(Prompt prompt) {
            ChatOptions options = prompt.getOptions();
            if (options instanceof AzureOpenAiChatOptions azureOptions) {
                azureOptions.setStop(null);
                azureOptions.setStopSequences(null);
                azureOptions.setMaxTokens(null);
            }
            return prompt;
        }
    }
}
