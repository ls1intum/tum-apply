package de.tum.cit.aet.utility;

import de.tum.cit.aet.notification.service.AsyncEmailSender;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class EmailMockConfiguration {

    @Bean
    @Primary
    public AsyncEmailSender asyncEmailSender() {
        return Mockito.mock(AsyncEmailSender.class);
    }
}
