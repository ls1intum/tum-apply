package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.*;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.notification.Email;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.core.service.EmailService;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    private final ApplicantRepository applicantRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    private final DocumentService documentService;
    private final DocumentDictionaryService documentDictionaryService;
    private final CurrentUserService currentUserService;
    private final EmailService emailService;

    /**
     * Creates a new job application for the given applicant and job.
     * If an application already exists for the applicant and job, an exception is
     * thrown.
     *
     * @param jobId the id of the job
     * @param applicantId the id of the applicant
     * @return the created ApplicationForApplicantDTO
     * @throws OperationNotAllowedException if the applicant has already applied for
     *                                      the job
     */
    @Transactional
    public ApplicationForApplicantDTO createApplication(UUID jobId, UUID applicantId) {
        if (applicationRepository.existsByApplicantUserIdAndJobJobId(jobId, applicantId)) {
            throw new OperationNotAllowedException("Applicant has already applied for this position");
        }
        Applicant applicant = applicantRepository
            .findById(applicantId)
            .orElseThrow(() -> EntityNotFoundException.forId("Applicant", applicantId));
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));

        Application application = new Application(
            null,
            null, // no applicationReview yet
            applicant,
            job,
            ApplicationState.SAVED,
            null,
            null,
            null,
            null,
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

        Applicant applicant = applicantRepository.getReferenceById(applicantDTO.user().userId());
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
        Applicant applicant = application.getApplicant();
        Job job = application.getJob();

        Email email = Email.builder()
            .to(applicant.getEmail())
            .template("application_withdrawn")
            .language(Language.fromCode(applicant.getSelectedLanguage()))
            .content(
                Map.of(
                    "applicantFirstName",
                    applicant.getFirstName(),
                    "applicantLastName",
                    applicant.getLastName(),
                    "jobTitle",
                    job.getTitle(),
                    "researchGroupName",
                    job.getResearchGroup().getName()
                )
            )
            .build();

        emailService.send(email);

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

    /**
     * Deletes a document from the document dictionary by its ID.
     *
     * @param documentDictionaryId the ID of the document to be deleted
     */
    public void deleteDocument(UUID documentDictionaryId) {
        documentDictionaryService.deleteById(documentDictionaryId);
    }

    /**
     * Retrieves a paginated list of application overviews for a specific applicant.
     *
     * @param pageSize    the number of applications per page
     * @param pageNumber  the page number to retrieve
     * @return a list of application overview DTOs
     */
    public List<ApplicationOverviewDTO> getAllApplications(int pageSize, int pageNumber) {
        UUID userId = currentUserService.getUserId();
        return applicationRepository.findApplicationsByApplicant(userId, pageNumber, pageSize);
    }

    /**
     * Returns the total number of applications submitted by a specific applicant.
     *
     * @param applicantId the ID of the applicant
     * @return the total number of applications
     */
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
     * @param cv          the uploaded CV file
     * @param application the application the CV belongs to
     */
    public void uploadCV(MultipartFile cv, Application application) {
        UUID userId = currentUserService.getUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        Document document = documentService.upload(cv, user);
        updateDocumentDictionaries(application, DocumentType.CV, Set.of(Pair.of(document, cv.getName())));
    }

    /**
     * Uploads multiple transcript documents and updates the dictionary mapping.
     *
     * @param transcripts the uploaded transcript files
     * @param type        the type of the transcript
     * @param application the application the transcripts belong to
     */
    public void uploadAdditionalTranscripts(List<MultipartFile> transcripts, DocumentType type, Application application) {
        UUID userId = currentUserService.getUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        Set<Pair<Document, String>> documents = transcripts
            .stream()
            .map(file -> Pair.of(documentService.upload(file, user), Optional.ofNullable(file.getOriginalFilename()).orElse("<empty>.pdf")))
            .collect(Collectors.toSet());
        updateDocumentDictionaries(application, type, documents);
    }

    /**
     * Updates the document dictionary entries for a given application and document
     * type.
     *
     * @param application  the application to associate the documents with
     * @param type         the type of documents being updated (e.g.,
     *                     BACHELOR_TRANSCRIPT, MASTER_TRANSCRIPT)
     * @param newDocuments the set of newly uploaded documents to associate
     */
    protected void updateDocumentDictionaries(Application application, DocumentType type, Set<Pair<Document, String>> newDocuments) {
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, type);
        documentDictionaryService.updateDocumentDictionaries(existingEntries, newDocuments, type, dd -> dd.setApplication(application));
    }

    /**
     * Retrieves the set of document IDs for the given application filtered by the
     * specified document type.
     *
     * @param application the application whose documents are queried; must not be
     *                    {@code null}
     * @param type        the document type to filter by; must not be {@code null}
     * @return a set of document IDs matching the given application and document
     *         type; never {@code null}
     */
    public Set<DocumentInformationHolderDTO> getDocumentIdsOfApplicationAndType(Application application, DocumentType type) {
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, type);
        return existingEntries.stream().map(e -> DocumentInformationHolderDTO.getFromDocumentDictionary(e)).collect(Collectors.toSet());
    }

    /**
     * Retrieves the document IDs associated with the application identified by the
     * given UUID.
     *
     * @param applicationId the UUID of the application; must not be {@code null}
     * @return an {@link ApplicationDocumentIdsDTO} containing the categorized
     *         document IDs for the application
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
        Application application = applicationRepository
            .findById(applicationId)
            .orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));

        return ApplicationDetailDTO.getFromEntity(application, application.getJob());
    }

    /**
     * Deletes all documents of a specific type associated with the given
     * application.
     *
     * @param applicationId the ID of the application
     * @param documentType  the type of documents to delete
     * @throws EntityNotFoundException if the application does not exist
     */
    public void deleteDocumentTypeOfDocuments(UUID applicationId, DocumentType documentType) {
        Optional<Application> application = this.applicationRepository.findById(applicationId);
        if (application.isEmpty()) {
            throw new EntityNotFoundException("Application does not exist");
        }
        this.documentDictionaryService.deleteByApplicationAndType(application.get(), documentType);
    }

    /**
     * Updates the name of the document with the given ID.
     *
     * @param documentId the ID of the document to rename
     * @param newName the new name to set for the document
     */
    public void renameDocument(UUID documentId, String newName) {
        documentDictionaryService.renameDocument(documentId, newName);
    }
}
