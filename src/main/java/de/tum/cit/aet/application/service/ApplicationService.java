package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import de.tum.cit.aet.application.domain.dto.CreateApplicationDTO;
import de.tum.cit.aet.application.domain.dto.DocumentInformationHolderDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@AllArgsConstructor
@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final DocumentService documentService;
    private final DocumentDictionaryService documentDictionaryService;
    private final ApplicantRepository applicantRepository;
    private final JobRepository jobRepository;

    /**
     * Creates a new job application for the given applicant and job.
     * If an application already exists for the applicant and job, an exception is thrown.
     *
     * @param createApplicationDTO DTO containing application and applicant data
     * @return the created ApplicationForApplicantDTO
     * @throws OperationNotAllowedException if the applicant has already applied for the job
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
        Applicant applicant = applicantRepository.getReferenceById(UUID.fromString("00000000-0000-0000-0000-000000000104"));
        applicant.setFirstName(createApplicationDTO.applicant().user().firstName());
        applicant.setLastName(createApplicationDTO.applicant().user().lastName());
        applicant.setGender(createApplicationDTO.applicant().user().gender());
        applicant.setNationality(createApplicationDTO.applicant().user().nationality());
        applicant.setBirthday(createApplicationDTO.applicant().user().birthday());
        applicant.setPhoneNumber(createApplicationDTO.applicant().user().phoneNumber());
        applicant.setWebsite(createApplicationDTO.applicant().user().website());
        applicant.setLinkedinUrl(createApplicationDTO.applicant().user().linkedinUrl());
        if (createApplicationDTO.applicant().user().selectedLanguage() != null) {
            applicant.setSelectedLanguage(createApplicationDTO.applicant().user().selectedLanguage());
        }

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
        applicantRepository.save(applicant);

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
     * Retrieves all applications submitted by a specific applicant.
     *
     * @param applicantId the UUID of the applicant
     * @return a set of ApplicationForApplicantDTO for the given applicant
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfApplicant(UUID applicantId) {
        return applicationRepository.findAllDtosByApplicantUserId(applicantId);
    }

    /**
     * Retrieves all applications for a specific job.
     *
     * @param jobId the UUID of the job
     * @return a set of ApplicationForApplicantDTO for the given job
     */
    public Set<ApplicationForApplicantDTO> getAllApplicationsOfJob(UUID jobId) {
        return applicationRepository.findAllDtosByJobJobId(jobId);
    }

    /**
     * Retrieves an application by its ID.
     *
     * @param applicationId the UUID of the application
     * @return the ApplicationForApplicantDTO with the given ID
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        return applicationRepository.findDtoById(applicationId);
    }

    /**
     * Updates an existing application with new information.
     *
     * @param updateApplicationDTO DTO containing updated application data
     * @return the updated ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO updateApplication(UpdateApplicationDTO updateApplicationDTO) {
        applicationRepository.updateApplication(
            updateApplicationDTO.applicationId(),
            updateApplicationDTO.applicationState().name(),
            updateApplicationDTO.desiredDate(),
            updateApplicationDTO.projects(),
            updateApplicationDTO.specialSkills(),
            updateApplicationDTO.motivation()
        );
        ApplicantDTO applicantDTO = updateApplicationDTO.applicant();

        Applicant applicant = applicantRepository.getReferenceById(UUID.fromString("00000000-0000-0000-0000-000000000104"));
        applicant.setFirstName(applicantDTO.user().firstName());
        applicant.setLastName(applicantDTO.user().lastName());
        applicant.setGender(applicantDTO.user().gender());
        applicant.setNationality(applicantDTO.user().nationality());
        applicant.setBirthday(applicantDTO.user().birthday());
        applicant.setPhoneNumber(applicantDTO.user().phoneNumber());
        applicant.setWebsite(applicantDTO.user().website());
        applicant.setLinkedinUrl(applicantDTO.user().linkedinUrl());
        if (applicantDTO.user().selectedLanguage() != null) {
            applicant.setSelectedLanguage(applicantDTO.user().selectedLanguage());
        }

        applicant.setStreet(applicantDTO.street());
        applicant.setPostalCode(applicantDTO.postalCode());
        applicant.setCity(applicantDTO.city());
        applicant.setCountry(applicantDTO.country());
        applicant.setBachelorDegreeName(applicantDTO.bachelorDegreeName());
        applicant.setBachelorGradingScale(applicantDTO.bachelorGradingScale());
        applicant.setBachelorGrade(applicantDTO.bachelorGrade());
        applicant.setBachelorUniversity(applicantDTO.bachelorUniversity());
        applicant.setMasterDegreeName(applicantDTO.masterDegreeName());
        applicant.setMasterGradingScale(applicantDTO.masterGradingScale());
        applicant.setMasterGrade(applicantDTO.masterGrade());
        applicant.setMasterUniversity(applicantDTO.masterUniversity());
        applicantRepository.save(applicant);

        return applicationRepository.findDtoById(updateApplicationDTO.applicationId());
    }

    /**
     * Withdraws an application by setting its state to WITHDRAWN.
     * If the application does not exist, the method does nothing.
     *
     * @param applicationId the UUID of the application to withdraw
     */
    @Transactional
    public void withdrawApplication(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            return;
        }
        application.setState(ApplicationState.WITHDRAWN);
        applicationRepository.save(application);
    }

    /**
     * Deletes an application by its ID.
     *
     * @param applicationId the UUID of the application to delete
     */
    @Transactional
    public void deleteApplication(UUID applicationId) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new EntityNotFoundException("Application with ID " + applicationId + " not found");
        }
        applicationRepository.deleteById(applicationId);
    }

    public List<ApplicationOverviewDTO> getAllApplications(UUID applicantId, int pageSize, int pageNumber) {
        return applicationRepository.findApplicationsByApplicant(applicantId, pageNumber, pageSize);
    }

    public long getNumberOfTotalApplications(UUID applicantId) {
        return this.applicationRepository.countByApplicant_UserId(applicantId);
    }

    /**
     * Retrieves all CV document entries for the given application.
     *
     * @param application the application to retrieve CVs for
     * @return set of document dictionary entries of type CV
     */
    public Set<DocumentDictionary> getCVs(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.CV);
    }

    /**
     * Retrieves all reference document entries for the given application.
     *
     * @param application the application to retrieve references for
     * @return set of document dictionary entries of type REFERENCE
     */
    public Set<DocumentDictionary> getReferences(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.REFERENCE);
    }

    /**
     * Retrieves all bachelor transcript document entries for the given application.
     *
     * @param application the application to retrieve bachelor transcripts for
     * @return set of document dictionary entries of type BACHELOR_TRANSCRIPT
     */
    public Set<DocumentDictionary> getBachelorTranscripts(Application application) {
        return documentDictionaryService.getDocumentDictionaries(application, DocumentType.BACHELOR_TRANSCRIPT);
    }

    /**
     * Retrieves all master transcript document entries for the given application.
     *
     * @param application the application to retrieve master transcripts for
     * @return set of document dictionary entries of type MASTER_TRANSCRIPT
     */
    public Set<DocumentDictionary> getMasterTranscripts(Application application) {
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
        updateDocumentDictionaries(application, DocumentType.CV, Set.of(Pair.of(document, cv.getName())));
    }

    // /**
    //  * Uploads multiple reference documents and updates the dictionary mapping.
    //  *
    //  * @param references the uploaded reference files
    //  * @param application the application the references belong to
    //  * @param user the user uploading the documents
    //  */
    // public void uploadReferences(List<MultipartFile> references, Application application, User user) {
    //     Set<Document> documents = references.stream().map(file -> documentService.upload(file, user)).collect(Collectors.toSet());
    //     updateDocumentDictionaries(application, DocumentType.REFERENCE, documents);
    // }

    // /**
    //  * Uploads multiple bachelor transcript documents and updates the dictionary mapping.
    //  *
    //  * @param bachelorTranscripts the uploaded bachelor transcript files
    //  * @param application the application the transcripts belong to
    //  * @param user the user uploading the documents
    //  */
    // public void uploadBachelorTranscripts(List<MultipartFile> bachelorTranscripts, Application application, User user) {
    //     Set<Document> documents = bachelorTranscripts.stream().map(file -> documentService.upload(file, user)).collect(Collectors.toSet());
    //     updateDocumentDictionaries(application, DocumentType.BACHELOR_TRANSCRIPT, documents);
    // }

    /**
     * Uploads multiple transcript documents and updates the dictionary mapping.
     *
     * @param transcripts the uploaded transcript files
     * @param type the type of the transcript
     * @param application the application the transcripts belong to
     * @param user the user uploading the documents
     */
    public void uploadTranscripts(List<MultipartFile> transcripts, DocumentType type, Application application, User user) {
        Set<Pair<Document, String>> documents = transcripts
            .stream()
            .map(file -> Pair.of(documentService.upload(file, user), Optional.ofNullable(file.getOriginalFilename()).orElse("<empty>.pdf")))
            .collect(Collectors.toSet());
        updateDocumentDictionaries(application, type, documents);
    }

    /**
     * Updates the document dictionary entries for a given application and document type.
     *
     * @param application    the application to associate the documents with
     * @param type           the type of documents being updated (e.g., BACHELOR_TRANSCRIPT, MASTER_TRANSCRIPT)
     * @param newDocuments   the set of newly uploaded documents to associate
     */
    protected void updateDocumentDictionaries(Application application, DocumentType type, Set<Pair<Document, String>> newDocuments) {
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, type);
        documentDictionaryService.updateDocumentDictionaries(existingEntries, newDocuments, type, dd -> dd.setApplication(application));
    }

    /**
     * Retrieves the set of document IDs for the given application filtered by the specified document type.
     *
     * @param application the application whose documents are queried; must not be {@code null}
     * @param type the document type to filter by; must not be {@code null}
     * @return a set of document IDs matching the given application and document type; never {@code null}
     */
    public Set<DocumentInformationHolderDTO> getDocumentIdsOfApplicationAndType(Application application, DocumentType type) {
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, type);
        return existingEntries.stream().map(e -> DocumentInformationHolderDTO.getFromDocumentDictionary(e)).collect(Collectors.toSet());
    }

    /**
     * Retrieves the document IDs associated with the application identified by the given UUID.
     *
     * @param applicationId the UUID of the application; must not be {@code null}
     * @return an {@link ApplicationDocumentIdsDTO} containing the categorized document IDs for the application
     * @throws IllegalArgumentException if {@code applicationId} is {@code null}
     */
    public ApplicationDocumentIdsDTO getDocumentDictionaryIdsOfApplication(UUID applicationId) {
        if (applicationId == null) {
            throw new IllegalArgumentException("The applicationId may not be null.");
        }
        Application application = applicationRepository.getReferenceById(applicationId);
        return documentDictionaryService.getDocumentIdsDTO(application);
    }

    /**
     * Retrieves the ApplicationDetailDTO fitting to the application id
     *
     * @param applicationId
     * @return ApplicationDetailDTO for application id
     */
    public ApplicationDetailDTO getApplicationDetail(UUID applicationId) {
        if (applicationId == null) {
            throw new IllegalArgumentException("The applicationId may not be null.");
        }
        Application application = applicationRepository.findById(applicationId).orElseThrow();

        return ApplicationDetailDTO.getFromEntity(application);
    }
}
