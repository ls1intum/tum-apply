package de.tum.cit.aet.core.config;

import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.core.http.HttpPipelineCallContext;
import com.azure.core.http.HttpPipelineNextPolicy;
import com.azure.core.http.HttpPipelineNextSyncPolicy;
import com.azure.core.http.HttpResponse;
import com.azure.core.http.policy.HttpPipelinePolicy;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.azure.openai.AzureOpenAiChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import reactor.core.publisher.Mono;

/**
 * Configuration for Spring AI chat clients.
 *
 * <p>Adds an {@link OpenAIClientBuilder} customizer that injects an HTTP pipeline policy
 * to strip unsupported parameters ({@code "stop"}) from the request body. This is required
 * because reasoning models (e.g., gpt-5-mini) reject the {@code stop} parameter, but
 * Spring AI 2.0 always includes it in the serialized Azure SDK request.</p>
 */
@Configuration
@Profile("!openapi")
public class SpringAIConfiguration {

    private static final Logger log = LoggerFactory.getLogger(SpringAIConfiguration.class);

    /**
     * Customizes the Azure OpenAI client builder to add a pipeline policy that strips
     * the {@code "stop"} parameter from chat completion requests.
     *
     * <p>This bean is picked up by Spring AI's Azure OpenAI auto-configuration and applied
     * before the {@link com.azure.ai.openai.OpenAIClient} is built.</p>
     *
     * @return the customizer that adds the stop-stripping policy
     */
    @Bean
    public org.springframework.ai.model.azure.openai.autoconfigure.AzureOpenAIClientBuilderCustomizer stripStopParameterCustomizer() {
        return builder -> builder.addPolicy(new StripStopParameterPolicy());
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
        for (ChatModel model : chatModels) {
            log.info(
                "Found Chat Model: {} with temperature: {}",
                model.getDefaultOptions().getModel(),
                model.getDefaultOptions().getTemperature()
            );
        }
        ChatModel chatModel = chatModels.getFirst();
        return ChatClient.builder(chatModel).build();
    }

    /**
     * Azure HTTP pipeline policy that removes the {@code "stop"} field from the JSON request body
     * of chat completion API calls. This prevents 400 errors from reasoning models that
     * do not support the {@code stop} parameter.
     */
    private static class StripStopParameterPolicy implements HttpPipelinePolicy {

        @Override
        public Mono<HttpResponse> process(HttpPipelineCallContext context, HttpPipelineNextPolicy next) {
            stripStopFromBody(context);
            return next.process();
        }

        @Override
        public HttpResponse processSync(HttpPipelineCallContext context, HttpPipelineNextSyncPolicy next) {
            stripStopFromBody(context);
            return next.processSync();
        }

        private void stripStopFromBody(HttpPipelineCallContext context) {
            var request = context.getHttpRequest();
            var body = request.getBodyAsBinaryData();
            if (body == null) {
                return;
            }
            String json = body.toString();
            if (json.contains("\"stop\"")) {
                // Remove "stop": null, "stop": [], or "stop": ["..."] patterns
                String cleaned = json.replaceAll(",?\\s*\"stop\"\\s*:\\s*(null|\\[[^]]*])", "");
                // Clean up leading comma if stop was the first field
                cleaned = cleaned.replaceAll("\\{\\s*,", "{");
                request.setBody(cleaned);
            }
        }
    }
}
