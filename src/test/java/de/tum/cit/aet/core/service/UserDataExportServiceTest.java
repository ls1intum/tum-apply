package de.tum.cit.aet.core.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipOutputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
class UserDataExportServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicantRepository applicantRepository;

    @Mock
    private UserSettingRepository userSettingRepository;

    @Mock
    private EmailSettingRepository emailSettingRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private DocumentDictionaryRepository documentDictionaryRepository;

    @Mock
    private UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    @Mock
    private ApplicationReviewRepository applicationReviewRepository;

    @Mock
    private InternalCommentRepository internalCommentRepository;

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentService documentService;

    @Mock
    private ZipExportService zipExportService;

    @Mock
    private ObjectMapper objectMapper;

    private UserDataExportService sut;

    private UUID userId;

    @BeforeEach
    void setup() throws Exception {
        userId = UUID.randomUUID();
        User user = new User();
        user.setFirstName("First");
        user.setLastName("Last");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ObjectWriter writer = org.mockito.Mockito.mock(ObjectWriter.class);
        when(objectMapper.writerWithDefaultPrettyPrinter()).thenReturn(writer);
        when(writer.writeValueAsString(any())).thenReturn("{}");

        // Manual construction of sut using mocked dependencies
        zipExportService = org.mockito.Mockito.mock(ZipExportService.class);

        sut = new UserDataExportService(
            userRepository,
            applicantRepository,
            userSettingRepository,
            emailSettingRepository,
            applicationRepository,
            documentDictionaryRepository,
            userResearchGroupRoleRepository,
            applicationReviewRepository,
            internalCommentRepository,
            ratingRepository,
            documentRepository,
            zipExportService,
            objectMapper
        );
    }

    @Test
    void exportWritesOnlySummaryIfNoApplicant() throws Exception {
        when(applicantRepository.existsById(userId)).thenReturn(false);

        MockHttpServletResponse response = new MockHttpServletResponse();

        sut.exportUserData(userId, response);

        // summary must be added (content is a byte[])
        verify(zipExportService).addFileToZip(any(), eq("user_data_summary.json"), any(byte[].class));
    }

    @Test
    void exportAddsDocumentWhenPresent() throws Exception {
        when(applicantRepository.existsById(userId)).thenReturn(true);

        Applicant applicant = new Applicant();
        when(applicantRepository.findById(userId)).thenReturn(Optional.of(applicant));

        UUID docId = UUID.randomUUID();
        Document doc = new Document();
        doc.setDocumentId(docId);
        doc.setSizeBytes(10L);

        de.tum.cit.aet.core.domain.DocumentDictionary dd = new de.tum.cit.aet.core.domain.DocumentDictionary();
        dd.setDocument(doc);
        dd.setName("file.pdf");
        dd.setDocumentType(DocumentType.CV);
        dd.setApplicant(applicant);

        when(documentDictionaryRepository.findAllByApplicant(applicant)).thenReturn(Set.of(dd));
        when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));

        MockHttpServletResponse response = new MockHttpServletResponse();

        sut.exportUserData(userId, response);

        verify(zipExportService).addFileToZip(any(), eq("user_data_summary.json"), any(byte[].class));
        // document was added under documents/<sanitized> via addDocumentToZip
        verify(zipExportService).addDocumentToZip(any(), eq("documents/file.pdf"), any(Document.class));
    }

    @Test
    void exportContinuesWhenDocumentDownloadFails() throws Exception {
        when(applicantRepository.existsById(userId)).thenReturn(true);

        Applicant applicant = new Applicant();
        when(applicantRepository.findById(userId)).thenReturn(Optional.of(applicant));

        UUID docId = UUID.randomUUID();
        Document doc = new Document();
        doc.setDocumentId(docId);
        doc.setSizeBytes(10L);

        de.tum.cit.aet.core.domain.DocumentDictionary dd = new de.tum.cit.aet.core.domain.DocumentDictionary();
        dd.setDocument(doc);
        dd.setName("file.pdf");
        dd.setDocumentType(DocumentType.CV);
        dd.setApplicant(applicant);

        when(documentDictionaryRepository.findAllByApplicant(applicant)).thenReturn(Set.of(dd));

        // document not found to force exception in addDocumentToZip
        when(documentRepository.findById(docId)).thenReturn(Optional.empty());

        MockHttpServletResponse response = new MockHttpServletResponse();

        // should not throw
        sut.exportUserData(userId, response);

        verify(zipExportService).addFileToZip(any(), eq("user_data_summary.json"), any(byte[].class));
        // ensure we did not try to add missing document
        verify(zipExportService, org.mockito.Mockito.never()).addDocumentToZip(
            any(ZipOutputStream.class),
            anyString(),
            any(Document.class)
        );
    }

    @Test
    void exportHandlesNullResearchGroupInRoles() throws Exception {
        when(applicantRepository.existsById(userId)).thenReturn(false);

        UserResearchGroupRole role = new UserResearchGroupRole();
        role.setRole(UserRole.APPLICANT);
        when(userResearchGroupRoleRepository.findAllByUser(any())).thenReturn(Set.of(role));

        MockHttpServletResponse response = new MockHttpServletResponse();

        // should not throw despite null research group
        sut.exportUserData(userId, response);

        verify(zipExportService).addFileToZip(any(), eq("user_data_summary.json"), any(byte[].class));
    }
}
