package de.tum.cit.aet.core.config;

import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.core.credential.KeyCredential;
import com.azure.core.http.HttpPipelineCallContext;
import com.azure.core.http.HttpPipelineNextPolicy;
import com.azure.core.http.HttpPipelineNextSyncPolicy;
import com.azure.core.http.HttpResponse;
import com.azure.core.http.policy.HttpPipelinePolicy;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.azure.openai.AzureOpenAiChatModel;
import org.springframework.ai.azure.openai.AzureOpenAiChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import reactor.core.publisher.Mono;

/**
 * Configuration for Spring AI chat clients.
 *
 * <p>Manually builds the {@link AzureOpenAiChatModel} with a custom HTTP pipeline policy
 * that strips unsupported parameters ({@code "stop"}) from the request body.
 * This is required because reasoning models (e.g., gpt-5-mini) reject the {@code stop}
 * parameter, but Spring AI 2.0 always includes it in the serialized Azure SDK request.</p>
 */
@Configuration
@Profile("!openapi")
public class SpringAIConfiguration {

    private static final Logger log = LoggerFactory.getLogger(SpringAIConfiguration.class);

    /**
     * Manually builds an {@link AzureOpenAiChatModel} with a pipeline policy that strips
     * the {@code "stop"} parameter from every chat completion request.
     *
     * <p>This replaces the auto-configured model to ensure the HTTP pipeline policy
     * is applied before any request reaches the Azure API.</p>
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.ai.azure.openai.enabled", havingValue = "true")
    public ChatModel azureOpenAiChatModel(
        @Value("${spring.ai.azure.openai.endpoint}") String endpoint,
        @Value("${spring.ai.azure.openai.api-key}") String apiKey,
        @Value("${spring.ai.azure.openai.chat.options.deployment-name}") String deploymentName,
        @Value("${spring.ai.azure.openai.chat.options.temperature:1.0}") Double temperature,
        @Value("${spring.ai.azure.openai.chat.options.max-completion-tokens:2000}") Integer maxCompletionTokens,
        @Value("${spring.ai.azure.openai.chat.options.reasoning-effort:#{null}}") String reasoningEffort
    ) {
        // Build the Azure OpenAI client builder with our custom pipeline policy
        OpenAIClientBuilder clientBuilder = new OpenAIClientBuilder()
            .endpoint(endpoint)
            .credential(new KeyCredential(apiKey))
            .addPolicy(new StripUnsupportedParametersPolicy());

        // Build chat options from YAML config
        var optionsBuilder = AzureOpenAiChatOptions.builder()
            .deploymentName(deploymentName)
            .temperature(temperature)
            .maxCompletionTokens(maxCompletionTokens);

        if (reasoningEffort != null) {
            optionsBuilder.reasoningEffort(reasoningEffort);
        }

        AzureOpenAiChatOptions options = optionsBuilder.build();

        log.info("Manually configured Azure OpenAI Chat Model: deployment={}, temperature={}, " +
                "maxCompletionTokens={}, reasoningEffort={} (with stop-stripping pipeline policy)",
            deploymentName, temperature, maxCompletionTokens, reasoningEffort);

        return AzureOpenAiChatModel.builder()
            .openAIClientBuilder(clientBuilder)
            .defaultOptions(options)
            .build();
    }

    /**
     * Default Chat Client for AI features.
     *
     * @param chatModels chat models that can be used (optional)
     * @return a configured ChatClient with default options, or null if model is not available
     */
    @Bean
    public ChatClient chatClient(List<ChatModel> chatModels) {
        if (chatModels == null || chatModels.isEmpty()) {
            return null;
        }
        ChatModel chatModel = chatModels.getFirst();
        log.info("Building ChatClient with model: {}", chatModel.getDefaultOptions().getModel());
        return ChatClient.builder(chatModel).build();
    }

    /**
     * Azure HTTP pipeline policy that removes unsupported parameters from the JSON request body.
     * Reasoning models (e.g., gpt-5-mini) reject {@code stop} and {@code max_tokens}.
     */
    private static class StripUnsupportedParametersPolicy implements HttpPipelinePolicy {

        @Override
        public Mono<HttpResponse> process(HttpPipelineCallContext context, HttpPipelineNextPolicy next) {
            stripFromBody(context);
            return next.process();
        }

        @Override
        public HttpResponse processSync(HttpPipelineCallContext context, HttpPipelineNextSyncPolicy next) {
            stripFromBody(context);
            return next.processSync();
        }

        private void stripFromBody(HttpPipelineCallContext context) {
            var request = context.getHttpRequest();
            var body = request.getBodyAsBinaryData();
            if (body == null) {
                return;
            }
            String json = body.toString();
            boolean modified = false;

            // Remove "stop": null or "stop": [...]
            if (json.contains("\"stop\"")) {
                json = json.replaceAll(",\\s*\"stop\"\\s*:\\s*(null|\\[[^]]*])", "");
                json = json.replaceAll("\"stop\"\\s*:\\s*(null|\\[[^]]*])\\s*,?", "");
                modified = true;
            }

            // Remove "max_tokens": N (reasoning models only accept max_completion_tokens)
            if (json.contains("\"max_tokens\"")) {
                json = json.replaceAll(",\\s*\"max_tokens\"\\s*:\\s*\\d+", "");
                json = json.replaceAll("\"max_tokens\"\\s*:\\s*\\d+\\s*,?", "");
                modified = true;
            }

            if (modified) {
                // Clean up any trailing/leading commas or double commas left behind
                json = json.replaceAll(",\\s*}", "}");
                json = json.replaceAll("\\{\\s*,", "{");
                request.setBody(json);
            }
        }
    }
}
