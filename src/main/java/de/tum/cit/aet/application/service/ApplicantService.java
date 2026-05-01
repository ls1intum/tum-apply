package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.application.domain.dto.DocumentInformationHolderDTO;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.documents.domain.ApplicantDocument;
import de.tum.cit.aet.core.documents.service.DocumentService;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.InvalidParameterException;
import de.tum.cit.aet.core.service.CurrentUserService;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
public class ApplicantService {

    private final ApplicantRepository applicantRepository;
    private final UserRepository userRepository;
    private final DocumentService documentService;
    private final CurrentUserService currentUserService;

    public Applicant findOrCreateApplicant(UUID userId) {
        return applicantRepository.findById(userId).orElseGet(() -> createApplicant(userId));
    }

    @Transactional
    public ApplicantDTO getApplicantProfile() {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        return ApplicantDTO.getFromEntity(findOrCreateApplicant(userId));
    }

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
     */
    @Transactional
    public Set<DocumentInformationHolderDTO> uploadApplicantProfileDocuments(DocumentType documentType, List<MultipartFile> files) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        Applicant applicant = findOrCreateApplicant(userId);

        switch (documentType) {
            case BACHELOR_TRANSCRIPT, MASTER_TRANSCRIPT, REFERENCE:
                uploadTranscripts(files, documentType, applicant);
                break;
            case CV:
                uploadCV(files.getFirst(), applicant);
                break;
            default:
                throw new NotImplementedException(String.format("The type %s is not supported yet", documentType.name()));
        }

        return getApplicantDocumentInformation(applicant, documentType);
    }

    /**
     * Retrieves the current applicant profile's document IDs grouped by type.
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
     */
    public void deleteApplicantProfileDocument(UUID documentId) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        documentService.deleteApplicantOwnedDocument(userId, documentId);
    }

    /**
     * Renames an applicant-profile document.
     */
    public void renameApplicantProfileDocument(UUID documentId, String newName) {
        UUID userId = currentUserService.getUserId();
        if (userId == null) {
            throw new InvalidParameterException("UserId must not be null.");
        }

        documentService.renameApplicantDocument(userId, documentId, newName);
    }

    public Set<ApplicantDocument> getCVs(Applicant applicant) {
        return documentService.listForApplicantByType(applicant, DocumentType.CV);
    }

    public Set<ApplicantDocument> getReferences(Applicant applicant) {
        return documentService.listForApplicantByType(applicant, DocumentType.REFERENCE);
    }

    public Set<ApplicantDocument> getBachelorTranscripts(Applicant applicant) {
        return documentService.listForApplicantByType(applicant, DocumentType.BACHELOR_TRANSCRIPT);
    }

    public Set<ApplicantDocument> getMasterTranscripts(Applicant applicant) {
        return documentService.listForApplicantByType(applicant, DocumentType.MASTER_TRANSCRIPT);
    }

    public void uploadCV(MultipartFile cv, Applicant applicant) {
        String name = Optional.ofNullable(cv.getOriginalFilename()).orElse("<empty>.pdf");
        documentService.uploadApplicantDocument(cv, DocumentType.CV, name, applicant);
    }

    public void uploadTranscripts(List<MultipartFile> files, DocumentType type, Applicant applicant) {
        for (MultipartFile file : files) {
            String name = Optional.ofNullable(file.getOriginalFilename()).orElse("<empty>.pdf");
            documentService.uploadApplicantDocument(file, type, name, applicant);
        }
    }

    Set<DocumentInformationHolderDTO> getApplicantDocumentInformation(Applicant applicant, DocumentType documentType) {
        return documentService
            .listForApplicantByType(applicant, documentType)
            .stream()
            .map(DocumentInformationHolderDTO::fromDocument)
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
