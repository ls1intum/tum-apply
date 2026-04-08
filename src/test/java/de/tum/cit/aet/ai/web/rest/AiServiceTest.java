package de.tum.cit.aet.ai.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.ai.service.AiService;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.job.service.JobService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;

    @Mock
    private ChatClient chatClient;

    @Mock
    private JobService jobService;

    @Mock
    private ApplicationService applicationService;

    @Mock
    private DocumentDictionaryService documentDictionaryService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserRepository userRepository;

    @Nested
    class MarkAiConsentForCurrentUser {

        private AiService createAiService() {
            when(chatClientBuilder.build()).thenReturn(chatClient);
            return new AiService(chatClientBuilder, jobService, applicationService, documentDictionaryService, currentUserService);
        }

        @Test
        void shouldSetConsentTimestampOnFirstAiUsage() {
            AiService aiService = createAiService();
            User user = new User();
            when(currentUserService.getUser()).thenReturn(user);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            currentUserService.markAiConsentForCurrentUser();

            assertThat(user.getAiConsentedAt()).isNotNull();
            assertThat(user.getAiConsentedAt()).isBeforeOrEqualTo(LocalDateTime.now(ZoneOffset.UTC));
            verify(userRepository).save(user);
        }

        @Test
        void shouldNotOverwriteExistingConsentTimestamp() {
            AiService aiService = createAiService();
            User user = new User();
            LocalDateTime originalConsent = LocalDateTime.of(2025, 1, 1, 12, 0);
            user.setAiConsentedAt(originalConsent);
            when(currentUserService.getUser()).thenReturn(user);

            currentUserService.markAiConsentForCurrentUser();

            assertThat(user.getAiConsentedAt()).isEqualTo(originalConsent);
            verify(userRepository, never()).save(any());
        }
    }
}
