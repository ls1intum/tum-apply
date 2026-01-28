package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.dto.exportdata.ApplicantDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.DocumentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InterviewProcessExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InterviewSlotExportDTO;
import de.tum.cit.aet.core.dto.exportdata.IntervieweeExportDTO;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.service.export.ExportContext;
import de.tum.cit.aet.core.service.export.UserDataExportBuilder;
import de.tum.cit.aet.core.service.export.UserDataSectionProvider;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicantDataExportProvider implements UserDataSectionProvider {

    private final ApplicantRepository applicantRepository;
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final ApplicationRepository applicationRepository;
    private final IntervieweeRepository intervieweeRepository;

    @Override
    public void contribute(ExportContext context, UserDataExportBuilder builder) {
        if (!context.hasApplicantRole() || !applicantRepository.existsById(context.user().getUserId())) {
            return;
        }
        builder.withApplicantData(buildApplicantData(context.user().getUserId()));
    }

    private ApplicantDataExportDTO buildApplicantData(UUID userId) {
        Applicant applicant = applicantRepository.findById(userId).orElseThrow();

        Set<DocumentExportDTO> documents = documentDictionaryRepository
            .findAllByApplicant(applicant)
            .stream()
            .map(dd ->
                new DocumentExportDTO(
                    dd.getDocument().getDocumentId(),
                    dd.getName(),
                    dd.getDocumentType(),
                    dd.getDocument().getMimeType(),
                    dd.getDocument().getSizeBytes()
                )
            )
            .collect(Collectors.toSet());

        List<ApplicationExportDTO> applications = applicationRepository
            .findAllByApplicantId(userId)
            .stream()
            .map(app ->
                new ApplicationExportDTO(
                    app.getJob().getTitle(),
                    app.getState(),
                    app.getDesiredStartDate(),
                    app.getMotivation(),
                    app.getSpecialSkills(),
                    app.getProjects()
                )
            )
            .toList();

        List<IntervieweeExportDTO> interviewees = getInterviewees(userId);

        return new ApplicantDataExportDTO(
            applicant.getStreet(),
            applicant.getPostalCode(),
            applicant.getCity(),
            applicant.getCountry(),
            applicant.getBachelorDegreeName(),
            applicant.getBachelorGradeUpperLimit(),
            applicant.getBachelorGradeLowerLimit(),
            applicant.getBachelorGrade(),
            applicant.getBachelorUniversity(),
            applicant.getMasterDegreeName(),
            applicant.getMasterGradeUpperLimit(),
            applicant.getMasterGradeLowerLimit(),
            applicant.getMasterGrade(),
            applicant.getMasterUniversity(),
            documents,
            applications,
            interviewees
        );
    }

    private List<IntervieweeExportDTO> getInterviewees(UUID userId) {
        return intervieweeRepository
            .findByApplicantUserIdWithDetails(userId)
            .stream()
            .map(interviewee ->
                new IntervieweeExportDTO(interviewee.getInterviewProcess().getJob().getTitle(), interviewee.getLastInvited())
            )
            .toList();
    }
}
