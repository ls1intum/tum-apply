package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
public class ApplicationService {

    private final ApplicationRepository repository;
    private final DocumentService documentService;
    private final DocumentDictionaryService documentDictionaryService;

    /**
     *
     * @param createApplicationDTO
     * @return created ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO createApplication(CreateApplicationDTO createApplicationDTO) {
        Application application = new Application(
            null,
            null, // no applicationReview yet
            null, //TODO get User from UUID
            null, // TODO get Job from JobcardDTO
            createApplicationDTO.applicationState(),
            createApplicationDTO.desiredDate(),
            createApplicationDTO.projects(),
            createApplicationDTO.specialSkills(),
            createApplicationDTO.motivation(),
            null,
            null, // TODO get CustomAnswers from CustomAnswerDto,
            null
        );

        Application savedApplication = repository.save(application);

        return ApplicationForApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     *
     * @param applicantId
     * @return Set of ApplicationForApplicantDTO which all have the same applicant
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfApplicant(UUID applicantId) {
        return repository
            .findAllByApplicantUserId(applicantId)
            .stream()
            .map(ApplicationForApplicantDTO::getFromEntity)
            .collect(Collectors.toSet());
    }

    /**
     *
     * @param jobId
     * @return Set of ApplicationForApplicantDTO which all have the same Job
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfJob(UUID jobId) {
        return repository.findAllByJobJobId(jobId).stream().map(ApplicationForApplicantDTO::getFromEntity).collect(Collectors.toSet());
    }

    /**
     *
     * @param applicationId
     * @return ApplicationForApplicantDTO with same Id as parameter applicationId
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        Application application = repository.findById(applicationId).orElse(null);
        return ApplicationForApplicantDTO.getFromEntity(application);
    }

    /**
     *
     * @param updateApplicationDTO
     * @return updated ApplicationForApplicantDTO with updated values
     */
    @Transactional
    public ApplicationForApplicantDTO updateApplication(UpdateApplicationDTO updateApplicationDTO) {
        Application application = repository.findById(updateApplicationDTO.applicationId()).orElse(null);
        // TODO set values of application
        Application updateApplication = repository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(updateApplication);
    }

    /**
     *
     * @param applicationId
     * @return withdrawn ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO withdrawApplication(UUID applicationId) {
        Application application = repository.findById(applicationId).orElse(null);
        if (application == null) {
            return null;
        }
        application.setState(ApplicationState.WITHDRAWN);
        Application savedApplication = repository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     *
     * @param applicationId
     */
    @Transactional
    public void deleteApplication(UUID applicationId) {
        repository.deleteById(applicationId);
    }

    public List<DocumentDictionary> getCVs(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.CV);
    }

    public List<DocumentDictionary> getReferences(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.REFERENCE);
    }

    public List<DocumentDictionary> getBachelorTranscripts(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.BACHELOR_TRANSCRIPT);
    }

    public List<DocumentDictionary> getMasterTranscripts(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.MASTER_TRANSCRIPT);
    }

    public List<Resource> downloadCVs(Application application) {
        List<DocumentDictionary> documentDictionaries = getCVs(application);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
    }

    public List<Resource> downloadReferences(Application application) {
        List<DocumentDictionary> documentDictionaries = getReferences(application);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
    }

    public List<Resource> downloadBachelorTranscripts(Application application) {
        List<DocumentDictionary> documentDictionaries = getBachelorTranscripts(application);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
    }

    public List<Resource> downloadMasterTranscripts(Application application) {
        List<DocumentDictionary> documentDictionaries = getMasterTranscripts(application);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
    }

    public void uploadCV(MultipartFile cv, Application application, User user) {
        Document document = documentService.upload(cv, user);
        updateDocumentDictionaries(application, DocumentType.CV, List.of(document));
    }

    public void uploadReferences(List<MultipartFile> references, Application application, User user) {
        List<Document> documents = references.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(application, DocumentType.REFERENCE, documents);
    }

    public void uploadBachelorTranscripts(List<MultipartFile> bachelorTranscripts, Application application, User user) {
        List<Document> documents = bachelorTranscripts.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(application, DocumentType.BACHELOR_TRANSCRIPT, documents);
    }

    public void uploadMasterTranscripts(List<MultipartFile> masterTranscripts, Application application, User user) {
        List<Document> documents = masterTranscripts.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(application, DocumentType.MASTER_TRANSCRIPT, documents);
    }

    public void updateDocumentDictionaries(Application application, DocumentType type, List<Document> newDocuments) {
        List<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, type);

        Set<UUID> newDocumentIds = newDocuments.stream().map(Document::getDocumentId).collect(Collectors.toSet());

        Set<UUID> existingDocumentIds = existingEntries.stream().map(dd -> dd.getDocument().getDocumentId()).collect(Collectors.toSet());

        // Delete entries that are no longer used
        for (DocumentDictionary dd : existingEntries) {
            if (!newDocumentIds.contains(dd.getDocument().getDocumentId())) {
                documentDictionaryService.delete(dd);
            }
        }

        // Add new entries
        for (Document doc : newDocuments) {
            if (!existingDocumentIds.contains(doc.getDocumentId())) {
                DocumentDictionary newEntry = new DocumentDictionary();
                newEntry.setApplication(application);
                newEntry.setDocument(doc);
                newEntry.setDocumentType(type);
                documentDictionaryService.save(newEntry);
            }
        }
    }
}
