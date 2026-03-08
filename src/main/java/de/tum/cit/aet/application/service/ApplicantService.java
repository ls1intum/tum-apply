package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.application.domain.dto.DocumentInformationHolderDTO;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.InvalidParameterException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.NotImplementedException;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
public class ApplicantService {

    private final ApplicantRepository applicantRepository;
    private final UserRepository userRepository;
    private final DocumentDictionaryService documentDictionaryService;
    private final DocumentService documentService;
    private final CurrentUserService currentUserService;

    public Applicant findOrCreateApplicant(UUID userId) {
        return applicantRepository.findById(userId).orElseGet(() -> createApplicant(userId));
    }

    /**
     * Retrieves the current user's applicant profile with all personal information.
     * Creates an empty applicant profile if none exists yet.
     *
     * @return the ApplicantDTO with current user and applicant data
     */
    @Transactional
    public ApplicantDTO getApplicantProfile() {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        return ApplicantDTO.getFromEntity(findOrCreateApplicant(userId));
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
        Applicant applicant = findOrCreateApplicant(userId);

        applyPersonalInformationData(user, applicant, dto);
        applyDocumentSettingsData(applicant, dto);
        userRepository.save(user);
        applicantRepository.save(applicant);

        return ApplicantDTO.getFromEntity(applicant);
    }

    /**
     * Updates only the current user's personal information segment.
     *
     * @param dto the updated applicant personal information
     * @return the updated ApplicantDTO
     */
    @Transactional
    public ApplicantDTO updateApplicantPersonalInformation(ApplicantDTO dto) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        Applicant applicant = findOrCreateApplicant(userId);

        applyPersonalInformationData(user, applicant, dto);
        userRepository.save(user);
        applicantRepository.save(applicant);

        return ApplicantDTO.getFromEntity(applicant);
    }

    /**
     * Updates only the current user's degree/document settings segment.
     *
     * @param dto the updated applicant document settings
     * @return the updated ApplicantDTO
     */
    @Transactional
    public ApplicantDTO updateApplicantDocumentSettings(ApplicantDTO dto) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        Applicant applicant = findOrCreateApplicant(userId);
        applyDocumentSettingsData(applicant, dto);
        applicantRepository.save(applicant);

        return ApplicantDTO.getFromEntity(applicant);
    }

    /**
     * Uploads applicant-profile documents of a given type and returns the resulting document list.
     *
     * @param documentType the type of documents to upload
     * @param files        the files to upload
     * @return the updated document list for that type
     */
    @Transactional
    public Set<DocumentInformationHolderDTO> uploadApplicantProfileDocuments(DocumentType documentType, List<MultipartFile> files) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        Applicant applicant = findOrCreateApplicant(userId);
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));

        switch (documentType) {
            case BACHELOR_TRANSCRIPT, MASTER_TRANSCRIPT, REFERENCE:
                uploadTranscripts(files, documentType, applicant, user);
                break;
            case CV:
                uploadCV(files.getFirst(), applicant, user);
                break;
            default:
                throw new NotImplementedException(String.format("The type %s is not supported yet", documentType.name()));
        }

        return getApplicantDocumentInformation(applicant, documentType);
    }

    /**
     * Retrieves the current applicant profile's document IDs grouped by document type.
     * Creates an empty applicant profile if none exists yet.
     *
     * @return an {@link ApplicationDocumentIdsDTO} containing the applicant profile documents
     */
    @Transactional
    public ApplicationDocumentIdsDTO getApplicantProfileDocumentIds() {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        Applicant applicant = findOrCreateApplicant(userId);

        ApplicationDocumentIdsDTO dto = new ApplicationDocumentIdsDTO();
        dto.setBachelorDocumentDictionaryIds(getApplicantDocumentInformation(applicant, DocumentType.BACHELOR_TRANSCRIPT));
        dto.setMasterDocumentDictionaryIds(getApplicantDocumentInformation(applicant, DocumentType.MASTER_TRANSCRIPT));
        dto.setReferenceDocumentDictionaryIds(getApplicantDocumentInformation(applicant, DocumentType.REFERENCE));
        dto.setCvDocumentDictionaryId(getApplicantDocumentInformation(applicant, DocumentType.CV).stream().findFirst().orElse(null));
        return dto;
    }

    /**
     * Deletes an applicant-profile document.
     *
     * @param documentDictionaryId the id of the document dictionary entry to delete
     */
    public void deleteApplicantProfileDocument(UUID documentDictionaryId) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        documentDictionaryService.deleteApplicantOwnedDocumentDictionary(userId, documentDictionaryId);
    }

    /**
     * Renames an applicant-profile document.
     *
     * @param documentDictionaryId the id of the document dictionary entry to rename
     * @param newName              the new name to set
     */
    public void renameApplicantProfileDocument(UUID documentDictionaryId, String newName) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        documentDictionaryService.renameApplicantOwnedDocumentDictionary(userId, documentDictionaryId, newName);
    }

    /**
     * Retrieves all CV document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve CVs for
     * @return set of document dictionary entries of type CV
     */
    public Set<DocumentDictionary> getCVs(Applicant applicant) {
        return documentDictionaryService.getApplicantDocumentDictionaries(applicant, DocumentType.CV);
    }

    /**
     * Retrieves all reference document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve references for
     * @return set of document dictionary entries of type REFERENCE
     */
    public Set<DocumentDictionary> getReferences(Applicant applicant) {
        return documentDictionaryService.getApplicantDocumentDictionaries(applicant, DocumentType.REFERENCE);
    }

    /**
     * Retrieves all bachelor transcript document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve bachelor transcripts for
     * @return set of document dictionary entries of type BACHELOR_TRANSCRIPT
     */
    public Set<DocumentDictionary> getBachelorTranscripts(Applicant applicant) {
        return documentDictionaryService.getApplicantDocumentDictionaries(applicant, DocumentType.BACHELOR_TRANSCRIPT);
    }

    /**
     * Retrieves all master transcript document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve master transcripts for
     * @return set of document dictionary entries of type MASTER_TRANSCRIPT
     */
    public Set<DocumentDictionary> getMasterTranscripts(Applicant applicant) {
        return documentDictionaryService.getApplicantDocumentDictionaries(applicant, DocumentType.MASTER_TRANSCRIPT);
    }

    /**
     * Uploads a single CV document and updates the dictionary mapping.
     *
     * @param cv the uploaded CV file
     * @param applicant the applicant the CV belongs to
     * @param user the user uploading the document
     */
    public void uploadCV(MultipartFile cv, Applicant applicant, User user) {
        Document document = documentService.upload(cv, user);
        updateDocumentDictionaries(
            applicant,
            DocumentType.CV,
            Set.of(Pair.of(document, Optional.ofNullable(cv.getOriginalFilename()).orElse("<empty>.pdf")))
        );
    }

    /**
     * Uploads multiple documents and updates the dictionary mapping.
     *
     * @param references the uploaded files
     * @param type the type of the document
     * @param applicant the applicant the belong to
     * @param user the user uploading the documents
     */
    public void uploadTranscripts(List<MultipartFile> references, DocumentType type, Applicant applicant, User user) {
        Set<Pair<Document, String>> documents = references
            .stream()
            .map(file -> Pair.of(documentService.upload(file, user), Optional.ofNullable(file.getOriginalFilename()).orElse("<empty>.pdf")))
            .collect(Collectors.toSet());
        updateDocumentDictionaries(applicant, type, documents);
    }

    /**
     * Updates the document dictionary entries for a given applicant and document type.
     *
     * @param applicant      the applicant to associate the documents with
     * @param type           the type of documents being updated (e.g., CV, REFERENCE)
     * @param newDocuments   the set of newly uploaded documents to associate
     */
    protected void updateDocumentDictionaries(Applicant applicant, DocumentType type, Set<Pair<Document, String>> newDocuments) {
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getApplicantDocumentDictionaries(applicant, type);
        documentDictionaryService.updateDocumentDictionaries(existingEntries, newDocuments, type, dd -> dd.setApplicant(applicant));
    }

    Set<DocumentInformationHolderDTO> getApplicantDocumentInformation(Applicant applicant, DocumentType documentType) {
        return documentDictionaryService
            .getApplicantDocumentDictionaries(applicant, documentType)
            .stream()
            .map(DocumentInformationHolderDTO::getFromDocumentDictionary)
            .collect(Collectors.toSet());
    }

    void applyPersonalInformationData(User user, Applicant applicant, ApplicantDTO dto) {
        if (dto.user() != null) {
            if (dto.user().firstName() != null) {
                user.setFirstName(dto.user().firstName());
            }
            if (dto.user().lastName() != null) {
                user.setLastName(dto.user().lastName());
            }
            if (dto.user().email() != null) {
                user.setEmail(dto.user().email());
            }
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
    }

    void applyDocumentSettingsData(Applicant applicant, ApplicantDTO dto) {
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
    }

    private Applicant createApplicant(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        Applicant applicant = new Applicant();
        applicant.setUser(user);
        return applicantRepository.save(applicant);
    }
}
