package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.util.PDFBuilder;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class PDFExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final ApplicationService applicationService;

    public PDFExportService(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Exports application details to PDF
     *
     * @param applicationId the application ID
     * @param labels        translation labels for PDF content
     * @return the PDF file as Resource
     */
    public Resource exportApplicationToPDF(UUID applicationId, Map<String, String> labels) {
        ApplicationDetailDTO app = applicationService.getApplicationDetail(applicationId);

        PDFBuilder builder = new PDFBuilder(labels.get("headline") + "'" + app.jobTitle() + "'");

        // Overview Section
        builder
                .setOverviewTitle(labels.get("overview"))
                .addOverviewItem(labels.get("supervisor"), getValue(app.supervisingProfessorName()))
                .addOverviewItem(labels.get("researchGroup"), getValue(app.researchGroup()))
                .addOverviewItem(labels.get("location"), getValue(app.jobLocation()));

        // Personal Statements Group
        builder.startSectionGroup(labels.get("personalStatements"));

        builder.startInfoSection(labels.get("motivation")).addSectionContent(getValue(app.motivation()));

        builder.startInfoSection(labels.get("skills")).addSectionContent(getValue(app.specialSkills()));

        builder.startInfoSection(labels.get("researchExperience")).addSectionContent(getValue(app.projects()));

        // Personal Information Group
        builder.startSectionGroup(labels.get("personalInformation"));

        builder
                .startInfoSection(labels.get("applicantInfo"))
                .addSectionData(labels.get("preferredLanguage"), getValue(app.applicant().user().preferredLanguage()))
                .addSectionData(labels.get("desiredStartDate"), formatDate(app.desiredDate()))
                .addSectionData(labels.get("gender"), getValue(app.applicant().user().gender()))
                .addSectionData(labels.get("nationality"), getValue(app.applicant().user().nationality()));

        if (app.applicant().user().website() != null) {
            builder.addSectionData(labels.get("website"), getValue(app.applicant().user().website()));
        }
        if (app.applicant().user().linkedinUrl() != null) {
            builder.addSectionData(labels.get("linkedIn"), getValue(app.applicant().user().linkedinUrl()));
        }

        // Bachelor Section
        builder
                .startInfoSection(labels.get("bachelorInfo"))
                .addSectionData(labels.get("degreeName"), getValue(app.applicant().bachelorDegreeName()))
                .addSectionData(labels.get("university"), getValue(app.applicant().bachelorUniversity()))
                // .addSectionData(labels.get("upperGradeLimit"),
                // getValue(app.applicant().bachelorGradeUpperLimit()))
                // .addSectionData(labels.get("lowerGradeLimit"),
                // getValue(app.applicant().bachelorGradeLowerLimit()))
                .addSectionData(labels.get("grade"), getValue(app.applicant().bachelorGrade()));

        // Master Section
        if (app.applicant().masterDegreeName() != null) {
            builder
                    .startInfoSection(labels.get("masterInfo"))
                    .addSectionData(labels.get("degreeName"), getValue(app.applicant().masterDegreeName()))
                    .addSectionData(labels.get("university"), getValue(app.applicant().masterUniversity()))
                    // .addSectionData(labels.get("upperGradeLimit"),
                    // getValue(app.applicant().masterGradeUpperLimit()))
                    // .addSectionData(labels.get("lowerGradeLimit"),
                    // getValue(app.applicant().masterGradeLowerLimit()))
                    .addSectionData(labels.get("grade"), getValue(app.applicant().masterGrade()));
        }

        return builder.build();
    }

    /**
     * Generates filename for application PDF
     *
     * @param applicationId    the application ID
     * @param applicationLabel label for application used as ending of the filename
     * @return sanitized filename for the PDF
     */
    public String generateApplicationFilename(UUID applicationId, String applicationLabel) {
        ApplicationDetailDTO app = applicationService.getApplicationDetail(applicationId);
        return sanitizeFilename(app.jobTitle()) + "_" + applicationLabel + ".pdf";
    }

    // Helper methods

    private String getValue(String value) {
        return (value != null && !value.isEmpty()) ? value : "-";
    }

    private String formatDate(Object date) {
        if (date == null) {
            return "-";
        }
        if (date instanceof java.time.LocalDate localDate) {
            return localDate.format(DATE_FORMATTER);
        }
        return date.toString();
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "document";
        }
        return filename.replaceAll("[^a-zA-Z0-9-_]", "_").substring(0, Math.min(filename.length(), 50));
    }
}
