package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
public class EmailTemplateInitializer {

    private final EmailTemplateService emailTemplateService;
    private final ResearchGroupRepository researchGroupRepository;

    /**
     * Initializes default email templates for all existing research groups on application startup.
     */
    @PostConstruct
    @Transactional
    public void initializeTemplates() {
        researchGroupRepository.findAll().forEach(emailTemplateService::addMissingTemplates);
        log.info("Email templates initialized successfully for all research groups");
    }
}
