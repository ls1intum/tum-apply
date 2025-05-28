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
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final DocumentService documentService;
    private final DocumentDictionaryService documentDictionaryService;
    private final JobRepository jobRepository;

    /**
     *
     * @param createApplicationDTO
     * @return created ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO createApplication(CreateApplicationDTO createApplicationDTO) {
        if (
            applicationRepository.existsByApplicantUserIdAndJobJobId(
                createApplicationDTO.applicant().user().userId(),
                createApplicationDTO.jobId()
            )
        ) {
            throw new OperationNotAllowedException("Applicant has already applied for this position");
        }

        Applicant applicant = new Applicant();
        applicant.setUserId(UUID.fromString("00000000-0000-0000-0000-000000000103"));
        applicant.setEmail(createApplicationDTO.applicant().user().email());
        applicant.setFirstName(createApplicationDTO.applicant().user().firstName());
        applicant.setLastName(createApplicationDTO.applicant().user().lastName());
        applicant.setGender(createApplicationDTO.applicant().user().gender());
        applicant.setNationality(createApplicationDTO.applicant().user().nationality());
        applicant.setBirthday(createApplicationDTO.applicant().user().birthday());
        applicant.setPhoneNumber(createApplicationDTO.applicant().user().phoneNumber());
        applicant.setWebsite(createApplicationDTO.applicant().user().website());
        applicant.setLinkedinUrl(createApplicationDTO.applicant().user().linkedinUrl());
        applicant.setSelectedLanguage(createApplicationDTO.applicant().user().selectedLanguage());

        applicant.setStreet(createApplicationDTO.applicant().street());
        applicant.setPostalCode(createApplicationDTO.applicant().postalCode());
        applicant.setCity(createApplicationDTO.applicant().city());
        applicant.setCountry(createApplicationDTO.applicant().country());
        applicant.setBachelorDegreeName(createApplicationDTO.applicant().bachelorDegreeName());
        applicant.setBachelorGradingScale(createApplicationDTO.applicant().bachelorGradingScale());
        applicant.setBachelorGrade(createApplicationDTO.applicant().bachelorGrade());
        applicant.setBachelorUniversity(createApplicationDTO.applicant().bachelorUniversity());
        applicant.setMasterDegreeName(createApplicationDTO.applicant().masterDegreeName());
        applicant.setMasterGradingScale(createApplicationDTO.applicant().masterGradingScale());
        applicant.setMasterGrade(createApplicationDTO.applicant().masterGrade());
        applicant.setMasterUniversity(createApplicationDTO.applicant().masterUniversity());

        Job job = jobRepository.getReferenceById(createApplicationDTO.jobId());
        Application application = new Application(
            null,
            null, // no applicationReview yet
            applicant,
            job,
            createApplicationDTO.applicationState(),
            createApplicationDTO.desiredDate(),
            createApplicationDTO.projects(),
            createApplicationDTO.specialSkills(),
            createApplicationDTO.motivation(),
            null,
            new HashSet<>(), // TODO get CustomAnswers from CustomAnswerDto,
            new HashSet<>()
        );
        Application savedApplication = applicationRepository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     *
     * @param applicantId
     * @return Set of ApplicationForApplicantDTO which all have the same applicant
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfApplicant(UUID applicantId) {
        return applicationRepository
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
        return applicationRepository
            .findAllByJobJobId(jobId)
            .stream()
            .map(ApplicationForApplicantDTO::getFromEntity)
            .collect(Collectors.toSet());
    }

    /**
     *
     * @param applicationId
     * @return ApplicationForApplicantDTO with same Id as parameter applicationId
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        return ApplicationForApplicantDTO.getFromEntity(application);
    }

    /**
     *
     * @param updateApplicationDTO
     * @return updated ApplicationForApplicantDTO with updated values
     */
    @Transactional
    public ApplicationForApplicantDTO updateApplication(UpdateApplicationDTO updateApplicationDTO) {
        Application application = applicationRepository.findById(updateApplicationDTO.applicationId()).orElse(null);
        // TODO set values of application
        Application updateApplication = applicationRepository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(updateApplication);
    }

    /**
     *
     * @param applicationId
     * @return withdrawn ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO withdrawApplication(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            return null;
        }
        application.setState(ApplicationState.WITHDRAWN);
        Application savedApplication = applicationRepository.save(application);
        return ApplicationForApplicantDTO.getFromEntity(savedApplication);
    }

    /**
     *
     * @param applicationId
     */
    @Transactional
    public void deleteApplication(UUID applicationId) {
        applicationRepository.deleteById(applicationId);
    }

    /**
     * Retrieves all CV document entries for the given application.
     *
     * @param application the application to retrieve CVs for
     * @return list of document dictionary entries of type CV
     */
    public List<DocumentDictionary> getCVs(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.CV);
    }

    /**
     * Retrieves all reference document entries for the given application.
     *
     * @param application the application to retrieve references for
     * @return list of document dictionary entries of type REFERENCE
     */
    public List<DocumentDictionary> getReferences(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.REFERENCE);
    }

    /**
     * Retrieves all bachelor transcript document entries for the given application.
     *
     * @param application the application to retrieve bachelor transcripts for
     * @return list of document dictionary entries of type BACHELOR_TRANSCRIPT
     */
    public List<DocumentDictionary> getBachelorTranscripts(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.BACHELOR_TRANSCRIPT);
    }

    /**
     * Retrieves all master transcript document entries for the given application.
     *
     * @param application the application to retrieve master transcripts for
     * @return list of document dictionary entries of type MASTER_TRANSCRIPT
     */
    public List<DocumentDictionary> getMasterTranscripts(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.MASTER_TRANSCRIPT);
    }

    /**
     * Uploads a single CV document and updates the dictionary mapping.
     *
     * @param cv the uploaded CV file
     * @param application the application the CV belongs to
     * @param user the user uploading the document
     */
    public void uploadCV(MultipartFile cv, Application application, User user) {
        Document document = documentService.upload(cv, user);
        updateDocumentDictionaries(application, DocumentType.CV, List.of(document));
    }

    /**
     * Uploads multiple reference documents and updates the dictionary mapping.
     *
     * @param references the uploaded reference files
     * @param application the application the references belong to
     * @param user the user uploading the documents
     */
    public void uploadReferences(List<MultipartFile> references, Application application, User user) {
        List<Document> documents = references.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(application, DocumentType.REFERENCE, documents);
    }

    /**
     * Uploads multiple bachelor transcript documents and updates the dictionary mapping.
     *
     * @param bachelorTranscripts the uploaded bachelor transcript files
     * @param application the application the transcripts belong to
     * @param user the user uploading the documents
     */
    public void uploadBachelorTranscripts(List<MultipartFile> bachelorTranscripts, Application application, User user) {
        List<Document> documents = bachelorTranscripts.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(application, DocumentType.BACHELOR_TRANSCRIPT, documents);
    }

    /**
     * Uploads multiple master transcript documents and updates the dictionary mapping.
     *
     * @param masterTranscripts the uploaded master transcript files
     * @param application the application the transcripts belong to
     * @param user the user uploading the documents
     */
    public void uploadMasterTranscripts(List<MultipartFile> masterTranscripts, Application application, User user) {
        List<Document> documents = masterTranscripts.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(application, DocumentType.MASTER_TRANSCRIPT, documents);
    }

    /**
     * Updates the document dictionary entries for a given application and document type.
     *
     * @param application    the application to associate the documents with
     * @param type           the type of documents being updated (e.g., BACHELOR_TRANSCRIPT, MASTER_TRANSCRIPT)
     * @param newDocuments   the list of newly uploaded documents to associate
     */
    protected void updateDocumentDictionaries(Application application, DocumentType type, List<Document> newDocuments) {
        List<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, type);
        documentDictionaryService.updateDocumentDictionaries(existingEntries, newDocuments, type, dd -> dd.setApplication(application));
    }
}
