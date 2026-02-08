package de.tum.cit.aet.application.service;

import static de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO.getFromEntity;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.*;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.InvalidParameterException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.core.util.PageUtil;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.NotImplementedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final AsyncEmailSender sender;

    /**
     * Creates a new job application for the given applicant and job.
     * If an application already exists for the applicant and job, an exception is
     * thrown.
     *
     * @param jobId the id of the job
     * @return the created ApplicationForApplicantDTO
     * @throws OperationNotAllowedException if the applicant has already applied for
     *                                      the job
     */
    @Transactional
    public ApplicationForApplicantDTO createApplication(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));

        UUID userId = currentUserService.getUserId();

        if (userId == null) {
            Application application = new Application();
            application.setJob(job);
            application.setState(ApplicationState.SAVED);
            return getFromEntity(application);
        }

        Application existingApplication = applicationRepository.getByApplicantByUserIdAndJobId(userId, jobId);
        if (existingApplication != null) {
            return getFromEntity(existingApplication);
        }
        Optional<Applicant> applicantOptional = applicantRepository.findById(userId);
        Applicant applicant;
        if (applicantOptional.isEmpty()) {
            applicant = createApplicant(userId);
        } else {
            applicant = applicantOptional.get();
        }

        Application newApplication = new Application();
        newApplication.setApplicant(applicant);
        newApplication.setJob(job);
        newApplication.setState(ApplicationState.SAVED);
        newApplication.setCustomFieldAnswers(new HashSet<>());
        newApplication.setInternalComments(new HashSet<>());

        // Initialize snapshot fields from applicant's current profile data
        User user = applicant.getUser();
        newApplication.setApplicantFirstName(user.getFirstName());
        newApplication.setApplicantLastName(user.getLastName());
        newApplication.setApplicantEmail(user.getEmail());
        newApplication.setApplicantGender(user.getGender());
        newApplication.setApplicantNationality(user.getNationality());
        newApplication.setApplicantBirthday(user.getBirthday());
        newApplication.setApplicantPhoneNumber(user.getPhoneNumber());
        newApplication.setApplicantWebsite(user.getWebsite());
        newApplication.setApplicantLinkedinUrl(user.getLinkedinUrl());

        newApplication.setApplicantStreet(applicant.getStreet());
        newApplication.setApplicantPostalCode(applicant.getPostalCode());
        newApplication.setApplicantCity(applicant.getCity());
        newApplication.setApplicantCountry(applicant.getCountry());

        newApplication.setApplicantBachelorDegreeName(applicant.getBachelorDegreeName());
        newApplication.setApplicantBachelorGradeUpperLimit(applicant.getBachelorGradeUpperLimit());
        newApplication.setApplicantBachelorGradeLowerLimit(applicant.getBachelorGradeLowerLimit());
        newApplication.setApplicantBachelorGrade(applicant.getBachelorGrade());
        newApplication.setApplicantBachelorUniversity(applicant.getBachelorUniversity());

        newApplication.setApplicantMasterDegreeName(applicant.getMasterDegreeName());
        newApplication.setApplicantMasterGradeUpperLimit(applicant.getMasterGradeUpperLimit());
        newApplication.setApplicantMasterGradeLowerLimit(applicant.getMasterGradeLowerLimit());
        newApplication.setApplicantMasterGrade(applicant.getMasterGrade());
        newApplication.setApplicantMasterUniversity(applicant.getMasterUniversity());

        Application savedApplication = applicationRepository.save(newApplication);

        // Prefill documents from applicant profile to the new application
        prefillDocumentsFromApplicantProfile(applicant, savedApplication);

        return getFromEntity(savedApplication);
    }

    /**
     * Copies document references from the applicant's profile to the newly created application.
     * This includes CVs, references, bachelor transcripts, master transcripts, and custom documents.
     *
     * @param applicant   the applicant whose documents should be copied
     * @param application the newly created application to receive the document references
     */
    private void prefillDocumentsFromApplicantProfile(Applicant applicant, Application application) {
        Set<DocumentDictionary> applicantDocuments = documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.CV);
        applicantDocuments.addAll(documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.BACHELOR_TRANSCRIPT));
        applicantDocuments.addAll(documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.MASTER_TRANSCRIPT));
        applicantDocuments.addAll(documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.REFERENCE));
        applicantDocuments.addAll(documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.CUSTOM));
        copyDocumentsToApplication(applicantDocuments, application);
    }

    /**
     * Creates new DocumentDictionary entries for the application, referencing the same documents.
     *
     * @param sourceDictionaries the source DocumentDictionary entries from the applicant profile
     * @param application        the application to associate the new entries with
     */
    private void copyDocumentsToApplication(Set<DocumentDictionary> sourceDictionaries, Application application) {
        for (DocumentDictionary source : sourceDictionaries) {
            DocumentDictionary copy = new DocumentDictionary();
            copy.setApplication(application);
            copy.setDocument(source.getDocument());
            copy.setName(source.getName());
            copy.setDocumentType(source.getDocumentType());
            documentDictionaryService.save(copy);
        }
    }

    /**
     * Retrieves an application by its ID.
     *
     * @param applicationId the UUID of the application
     * @return the ApplicationForApplicantDTO with the given ID
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        return assertCanViewApplicationDTO(applicationId);
    }

    /**
     * Updates an existing application with new information.
     * Updates are stored in the application's snapshot fields, not in the applicant entity.
     * When the application is sent, the snapshot data is synced back to the applicant profile.
     *
     * @param updateApplicationDTO DTO containing updated application data
     * @return the updated ApplicationForApplicantDTO
     */
    @Transactional
    public ApplicationForApplicantDTO updateApplication(UpdateApplicationDTO updateApplicationDTO) {
        Application application = assertCanManageApplication(updateApplicationDTO.applicationId());
        application.setState(updateApplicationDTO.applicationState());
        application.setDesiredStartDate(updateApplicationDTO.desiredDate());
        application.setProjects(updateApplicationDTO.projects());
        application.setSpecialSkills(updateApplicationDTO.specialSkills());
        application.setMotivation(updateApplicationDTO.motivation());
        if (updateApplicationDTO.applicationState().equals(ApplicationState.SENT)) {
            application.setAppliedAt(LocalDateTime.now());
        }

        // Update snapshot fields in the application entity instead of the applicant entity
        ApplicantDTO applicantDTO = updateApplicationDTO.applicant();
        application.setApplicantFirstName(applicantDTO.user().firstName());
        application.setApplicantLastName(applicantDTO.user().lastName());
        application.setApplicantEmail(applicantDTO.user().email());
        application.setApplicantGender(applicantDTO.user().gender());
        application.setApplicantNationality(applicantDTO.user().nationality());
        application.setApplicantBirthday(applicantDTO.user().birthday());
        application.setApplicantPhoneNumber(applicantDTO.user().phoneNumber());
        application.setApplicantWebsite(applicantDTO.user().website());
        application.setApplicantLinkedinUrl(applicantDTO.user().linkedinUrl());

        application.setApplicantStreet(applicantDTO.street());
        application.setApplicantPostalCode(applicantDTO.postalCode());
        application.setApplicantCity(applicantDTO.city());
        application.setApplicantCountry(applicantDTO.country());
        application.setApplicantBachelorDegreeName(applicantDTO.bachelorDegreeName());
        application.setApplicantBachelorGradeUpperLimit(applicantDTO.bachelorGradeUpperLimit());
        application.setApplicantBachelorGradeLowerLimit(applicantDTO.bachelorGradeLowerLimit());
        application.setApplicantBachelorGrade(applicantDTO.bachelorGrade());
        application.setApplicantBachelorUniversity(applicantDTO.bachelorUniversity());
        application.setApplicantMasterDegreeName(applicantDTO.masterDegreeName());
        application.setApplicantMasterGradeUpperLimit(applicantDTO.masterGradeUpperLimit());
        application.setApplicantMasterGradeLowerLimit(applicantDTO.masterGradeLowerLimit());
        application.setApplicantMasterGrade(applicantDTO.masterGrade());
        application.setApplicantMasterUniversity(applicantDTO.masterUniversity());

        application = applicationRepository.save(application);

        // When application is sent, sync snapshot data back to applicant profile
        if (ApplicationState.SENT.equals(updateApplicationDTO.applicationState())) {
            syncSnapshotDataToApplicant(application);
            syncDocumentsToApplicantProfile(application);
            confirmApplicationToApplicant(application);
            confirmApplicationToProfessor(application);
        }
        return ApplicationForApplicantDTO.getFromEntity(application);
    }

    /**
     * Syncs snapshot data from application back to the applicant profile.
     * This ensures the applicant's profile is updated with the latest data when an application is sent.
     *
     * @param application the application containing the snapshot data to sync
     */
    private void syncSnapshotDataToApplicant(Application application) {
        Applicant applicant = application.getApplicant();
        User user = applicant.getUser();

        applyApplicantData(user, applicant, ApplicantDTO.getFromApplicationSnapshot(application));
    }

    /**
     * Syncs documents from application to the applicant's profile.
     * This ensures documents uploaded during application creation are available for future applications
     *
     * @param application the application containing the documents to sync
     */
    private void syncDocumentsToApplicantProfile(Application application) {
        Applicant applicant = application.getApplicant();

        // Sync all document types
        syncDocumentsByType(application, applicant, DocumentType.CV);
        syncDocumentsByType(application, applicant, DocumentType.REFERENCE);
        syncDocumentsByType(application, applicant, DocumentType.BACHELOR_TRANSCRIPT);
        syncDocumentsByType(application, applicant, DocumentType.MASTER_TRANSCRIPT);
        syncDocumentsByType(application, applicant, DocumentType.CUSTOM);
    }

    /**
     * Syncs documents of a specific type from application to applicant profile.
     * Replaces existing documents in the applicant profile with those from the application.
     * This ensures that documents deleted or replaced in the application are also removed from the profile.
     *
     * @param application  the application containing the documents
     * @param applicant    the applicant whose profile should receive the documents
     * @param documentType the type of documents to sync
     */
    private void syncDocumentsByType(Application application, Applicant applicant, DocumentType documentType) {
        Set<DocumentDictionary> applicationDocs = documentDictionaryService.getDocumentDictionaries(application, documentType);
        Set<DocumentDictionary> applicantDocs = documentDictionaryService.getDocumentDictionaries(applicant, documentType);

        // Delete all existing documents from applicant profile
        for (DocumentDictionary applicantDoc : applicantDocs) {
            documentDictionaryService.deleteApplicantDocumentDictionary(applicantDoc.getDocumentDictionaryId());
        }

        // Copy all documents from application dictionary to applicant profile
        for (DocumentDictionary appDoc : applicationDocs) {
            DocumentDictionary copy = new DocumentDictionary();
            copy.setApplicant(applicant);
            copy.setDocument(appDoc.getDocument());
            copy.setName(appDoc.getName());
            copy.setDocumentType(appDoc.getDocumentType());
            documentDictionaryService.save(copy);
        }
    }

    private void confirmApplicationToApplicant(Application application) {
        User user = application.getApplicant().getUser();
        Email email = Email.builder()
            .to(user)
            .language(Language.fromCode(user.getSelectedLanguage()))
            .emailType(EmailType.APPLICATION_SENT)
            .content(application)
            .researchGroup(application.getJob().getResearchGroup())
            .build();
        sender.sendAsync(email);
    }

    private void confirmApplicationToProfessor(Application application) {
        User supervisingProfessor = application.getJob().getSupervisingProfessor();
        Email email = Email.builder()
            .to(supervisingProfessor)
            .language(Language.fromCode(supervisingProfessor.getSelectedLanguage()))
            .emailType(EmailType.APPLICATION_RECEIVED)
            .content(application)
            .researchGroup(application.getJob().getResearchGroup())
            .build();
        sender.sendAsync(email);
    }

    /**
     * Withdraws an application by setting its state to WITHDRAWN.
     * If the application does not exist, the method does nothing.
     *
     * @param applicationId the UUID of the application to withdraw
     */
    @Transactional
    public void withdrawApplication(UUID applicationId) {
        Application application = assertCanManageApplication(applicationId);
        User user = application.getApplicant().getUser();
        Job job = application.getJob();

        application.setState(ApplicationState.WITHDRAWN);
        application = applicationRepository.save(application);

        Email email = Email.builder()
            .to(user)
            .language(Language.fromCode(user.getSelectedLanguage()))
            .emailType(EmailType.APPLICATION_WITHDRAWN)
            .content(application)
            .researchGroup(job.getResearchGroup())
            .build();

        sender.sendAsync(email);
    }

    /**
     * Deletes an application by its ID.
     *
     * @param applicationId the UUID of the application to delete
     */
    @Transactional
    public void deleteApplication(UUID applicationId) {
        assertCanManageApplication(applicationId);
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
     * @param pageDTO the pagination information
     * @param sortDTO the sorting configuration
     * @return a page of application overview DTOs
     */
    public Page<ApplicationOverviewDTO> getAllApplications(PageDTO pageDTO, SortDTO sortDTO) {
        UUID userId = currentUserService.getUserId();
        Pageable pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.APPLICANT_APPLICATIONS, true);
        return applicationRepository.findApplicationsByApplicant(userId, pageable);
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
    private void uploadCV(MultipartFile cv, Application application) {
        UUID userId = currentUserService.getUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        Document document = documentService.upload(cv, user);
        updateDocumentDictionaries(application, DocumentType.CV, Set.of(Pair.of(document, cv.getOriginalFilename())));
    }

    /**
     * Uploads multiple transcript documents and updates the dictionary mapping.
     *
     * @param transcripts the uploaded transcript files
     * @param type        the type of the transcript
     * @param application the application the transcripts belong to
     */
    private void uploadAdditionalTranscripts(List<MultipartFile> transcripts, DocumentType type, Application application) {
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
     * specified document type and uploads new documents.
     *
     * @param applicationId the UUID of the application
     * @param documentType  the type of documents to filter by
     * @param files         the list of files to be uploaded
     * @return a set of document IDs matching the given application and document
     */
    public Set<DocumentInformationHolderDTO> getDocumentIdsOfApplicationAndType(
        UUID applicationId,
        DocumentType documentType,
        List<MultipartFile> files
    ) {
        Application application = assertCanManageApplication(applicationId);

        switch (documentType) {
            case BACHELOR_TRANSCRIPT, MASTER_TRANSCRIPT, REFERENCE:
                uploadAdditionalTranscripts(files, documentType, application);
                break;
            case CV:
                uploadCV(files.getFirst(), application);
                // Only one file allowed
                break;
            default:
                throw new NotImplementedException(String.format("The type %s is not supported yet", documentType.name()));
        }
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, documentType);
        return existingEntries.stream().map(DocumentInformationHolderDTO::getFromDocumentDictionary).collect(Collectors.toSet());
    }

    /**
     * Retrieves the document IDs associated with the application identified by the
     * given UUID.
     *
     * @param applicationId the UUID of the application; must not be {@code null}
     * @return an {@link ApplicationDocumentIdsDTO} containing the categorized
     * document IDs for the application
     * @throws IllegalArgumentException if {@code applicationId} is {@code null}
     */
    public ApplicationDocumentIdsDTO getDocumentDictionaryIdsOfApplication(UUID applicationId) {
        Application application = assertCanViewApplication(applicationId);
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
        Application application = assertCanManageApplication(applicationId);
        return ApplicationDetailDTO.getFromEntity(application, application.getJob());
    }

    /**
     * Updates the name of the document with the given ID.
     *
     * @param documentId the ID of the document to rename
     * @param newName    the new name to set for the document
     */
    public void renameDocument(UUID documentId, String newName) {
        documentDictionaryService.renameDocument(documentId, newName);
    }

    /**
     * Retrieves the current user's applicant profile with all personal information.
     * Creates an empty applicant profile if none exists yet.
     *
     * @return the ApplicantDTO with current user and applicant data
     */
    public ApplicantDTO getApplicantProfile() {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        Optional<Applicant> applicantOptional = applicantRepository.findById(userId);
        Applicant applicant;
        if (applicantOptional.isEmpty()) {
            applicant = createApplicant(userId);
        } else {
            applicant = applicantOptional.get();
        }

        return ApplicantDTO.getFromEntity(applicant);
    }

    /**
     * Updates the current user's applicant profile with personal information.
     * Writes directly to `User` and `Applicant` entities.
     *
     * @param dto the updated applicant data
     * @return the updated ApplicantDTO
     */
    @Transactional
    public ApplicantDTO updateApplicantProfile(ApplicantDTO dto) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        Applicant applicant = applicantRepository.findById(userId).orElseGet(() -> createApplicant(userId));

        applyApplicantData(user, applicant, dto);
        userRepository.save(user);
        applicantRepository.save(applicant);

        return ApplicantDTO.getFromEntity(applicant);
    }

    /**
     * Creates an Applicant for the given userId
     *
     * @param userId The id of the User
     * @return the created Applicant
     */
    private Applicant createApplicant(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Applicant applicant = new Applicant();
        applicant.setUser(user);
        return applicantRepository.save(applicant);
    }

    /**
     * Applies applicant and user data from a DTO and persists both entities.
     */
    private void applyApplicantData(User user, Applicant applicant, ApplicantDTO dto) {
        if (dto.user() != null) {
            if (dto.user().firstName() != null) user.setFirstName(dto.user().firstName());
            if (dto.user().lastName() != null) user.setLastName(dto.user().lastName());
            if (dto.user().email() != null) user.setEmail(dto.user().email());
            user.setGender(dto.user().gender());
            user.setNationality(dto.user().nationality());
            user.setBirthday(dto.user().birthday());
            user.setPhoneNumber(dto.user().phoneNumber());
            user.setWebsite(dto.user().website());
            user.setLinkedinUrl(dto.user().linkedinUrl());
        }

        applicant.setStreet(dto.street());
        applicant.setPostalCode(dto.postalCode());
        applicant.setCity(dto.city());
        applicant.setCountry(dto.country());

        applicant.setBachelorDegreeName(dto.bachelorDegreeName());
        applicant.setBachelorGradeUpperLimit(dto.bachelorGradeUpperLimit());
        applicant.setBachelorGradeLowerLimit(dto.bachelorGradeLowerLimit());
        applicant.setBachelorGrade(dto.bachelorGrade());
        applicant.setBachelorUniversity(dto.bachelorUniversity());

        applicant.setMasterDegreeName(dto.masterDegreeName());
        applicant.setMasterGradeUpperLimit(dto.masterGradeUpperLimit());
        applicant.setMasterGradeLowerLimit(dto.masterGradeLowerLimit());
        applicant.setMasterGrade(dto.masterGrade());
        applicant.setMasterUniversity(dto.masterUniversity());

        // Save operations moved to updateApplicantProfile
    }

    /**
     * Asserts that the current user can manage the application with the given ID.
     *
     * @param applicationId the ID of the application to check
     * @return the application entity if the user can manage it
     */
    private Application assertCanManageApplication(UUID applicationId) {
        if (applicationId == null) {
            throw new InvalidParameterException("The applicationId may not be null.");
        }
        Application application = applicationRepository
            .findById(applicationId)
            .orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));
        currentUserService.isCurrentUserOrAdmin(application.getApplicant().getUserId());
        return application;
    }

    private Application assertCanViewApplication(UUID applicationId) {
        if (applicationId == null) {
            throw new InvalidParameterException("The applicationId may not be null.");
        }
        Application application = applicationRepository
            .findById(applicationId)
            .orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));
        if (currentUserService.isProfessor() || currentUserService.isEmployee()) {
            return application;
        }
        currentUserService.isCurrentUserOrAdmin(application.getApplicant().getUserId());
        return application;
    }

    /**
     * Asserts that the current user can view the application with the given ID.
     * Allows access to:
     * - Application owner (applicant)
     * - Admins
     * - Any professor
     *
     * @param applicationId the ID of the application to check
     * @return the applicationForApplicantDTO entity if the user can view it
     */
    private ApplicationForApplicantDTO assertCanViewApplicationDTO(UUID applicationId) {
        if (applicationId == null) {
            throw new InvalidParameterException("The applicationId may not be null.");
        }

        ApplicationForApplicantDTO application = applicationRepository.findDtoById(applicationId);
        if (application == null) {
            throw EntityNotFoundException.forId("Application", applicationId);
        }

        // Allow any professor or employee to view applications
        if (currentUserService.isProfessor() || currentUserService.isEmployee()) {
            return application;
        }

        currentUserService.isCurrentUserOrAdmin(application.applicant().user().userId());
        return application;
    }
}
