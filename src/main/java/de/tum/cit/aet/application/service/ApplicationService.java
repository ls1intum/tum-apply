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
import de.tum.cit.aet.core.exception.InvalidParameterException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.constants.GradingScale;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.service.UserService;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.NotImplementedException;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

import static de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO.getFromEntity;

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
    private final UserService userService;

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

        if (userId==null) {
            Application application = new Application();
            application.setJob(job);
            application.setState(ApplicationState.SAVED);
            return getFromEntity(application);
        }

        Application existingApplication = applicationRepository.getByApplicantByUserIdAndJobId(userId, jobId);
        if (existingApplication!=null) {
            return getFromEntity(existingApplication);
        }
        Optional<Applicant> applicantOptional = applicantRepository.findById(userId);
        Applicant applicant;
        if (applicantOptional.isEmpty()) {
            applicant = createApplicant(userId);
        } else {
            applicant = applicantOptional.get();
        }

        Application newApplication = new Application(
            null,
            null, // no applicationReview yet
            applicant,
            job,
            ApplicationState.SAVED,
            null,
            null,
            null,
            null,
            new HashSet<>(), // TODO get CustomAnswers from CustomAnswerDto,
            new HashSet<>()
        );
        Application savedApplication = applicationRepository.save(newApplication);
        return getFromEntity(savedApplication);
    }

    /**
     * Retrieves an application by its ID.
     *
     * @param applicationId the UUID of the application
     * @return the ApplicationForApplicantDTO with the given ID
     */
    public ApplicationForApplicantDTO getApplicationById(UUID applicationId) {
        return assertCanManageApplicationDTO(applicationId);
    }

    /**
     * Updates an existing application with new information.
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
        application = applicationRepository.save(application);

        ApplicantDTO applicantDTO = updateApplicationDTO.applicant();
        Applicant applicant = assertCanManageApplicant(application.getApplicant().getUserId());
        User user = applicant.getUser();
        user.setFirstName(applicantDTO.user().firstName());
        user.setLastName(applicantDTO.user().lastName());
        user.setGender(applicantDTO.user().gender());
        user.setNationality(applicantDTO.user().nationality());
        user.setBirthday(applicantDTO.user().birthday());
        user.setPhoneNumber(applicantDTO.user().phoneNumber());
        user.setWebsite(applicantDTO.user().website());
        user.setLinkedinUrl(applicantDTO.user().linkedinUrl());
        if (applicantDTO.user().selectedLanguage()!=null) {
            applicant.getUser().setSelectedLanguage(applicantDTO.user().selectedLanguage());
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

        if (ApplicationState.SENT.equals(updateApplicationDTO.applicationState())) {
            confirmApplicationToApplicant(application);
            confirmApplicationToProfessor(application);
        }
        return ApplicationForApplicantDTO.getFromEntity(application);
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
     * @param pageSize   the number of applications per page
     * @param pageNumber the page number to retrieve
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
        currentUserService.isCurrentUserOrAdmin(applicantId);
        return this.applicationRepository.countByApplicantId(applicantId);
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
    private void uploadAdditionalTranscripts(List<MultipartFile> transcripts, DocumentType type,
                                             Application application) {
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
     * @param applicationId the UUID of the application
     * @param documentType  the type of documents to filter by
     * @param files         the list of files to be uploaded
     * @return a set of document IDs matching the given application and document
     */
    public Set<DocumentInformationHolderDTO> getDocumentIdsOfApplicationAndType(UUID applicationId, DocumentType documentType, List<MultipartFile> files) {
        Application application = assertCanManageApplication(applicationId);

        switch (documentType) {
            case BACHELOR_TRANSCRIPT, MASTER_TRANSCRIPT, REFERENCE:
                uploadAdditionalTranscripts(files, documentType, application);
                break;
            case CV:
                uploadCV(files.getFirst(), application);
                break; // TODO only one file allowed
            default:
                throw new NotImplementedException(String.format("The type %s is not supported yet", documentType.name()));
        }
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(application, documentType);
        return existingEntries
            .stream()
            .map(DocumentInformationHolderDTO::getFromDocumentDictionary)
            .collect(Collectors.toSet());
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

        Application application = assertCanManageApplication(applicationId);
        return documentDictionaryService.getDocumentIdsDTO(application);
    }

    /**
     * Retrieves the ApplicationDetailDTO fitting to the application id
     *
     * @param applicationId
     * @return ApplicationDetailDTO for application id
     */
    public ApplicationDetailDTO getApplicationDetail(UUID applicationId) {
        if (applicationId==null) {
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
     * Creates an Applicant for the given userId
     *
     * @param userId The id of the User
     * @return the created Applicant
     */
    private Applicant createApplicant(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Applicant applicant = new Applicant();
        applicant.setUser(user);
        applicant.setBachelorGradingScale(GradingScale.ONE_TO_FOUR);
        applicant.setMasterGradingScale(GradingScale.ONE_TO_FOUR);
        return applicantRepository.save(applicant);
    }

    /**
     * Asserts that the current user can manage the application with the given ID.
     *
     * @param applicationId the ID of the application to check
     * @return the application entity if the user can manage it
     */
    private Application assertCanManageApplication(UUID applicationId) {
        if (applicationId==null) {
            throw new InvalidParameterException("The applicationId may not be null.");
        }
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));
        currentUserService.isCurrentUserOrAdmin(application.getApplicant().getUserId());
        return application;
    }

    /**
     * Asserts that the current user can manage the application with the given ID.
     *
     * @param applicationId the ID of the application to check
     * @return the applicationForApplicantDTO entity if the user can manage it
     */
    private ApplicationForApplicantDTO assertCanManageApplicationDTO(UUID applicationId) {
        if (applicationId==null) {
            throw new InvalidParameterException("The applicationId may not be null.");
        }
        ApplicationForApplicantDTO application = applicationRepository.findDtoById(applicationId);
        currentUserService.isCurrentUserOrAdmin(application.applicant().user().userId());
        return applicationRepository.findDtoById(applicationId);
    }

    /**
     * Asserts that the current user can manage the applicant with the given ID.
     *
     * @param applicantId the id of the applicant to check
     * @return the application entity if the user can manage it
     */
    private Applicant assertCanManageApplicant(UUID applicantId) {
        if (applicantId==null) {
            throw new InvalidParameterException("The applicantId may not be null.");
        }
        Applicant applicant = applicantRepository.getReferenceById(applicantId);
        currentUserService.isCurrentUserOrAdmin(applicant.getUserId());
        return applicant;
    }
}
