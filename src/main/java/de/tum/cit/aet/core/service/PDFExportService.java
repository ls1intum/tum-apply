package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.core.util.PDFBuilder;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.service.JobService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class PDFExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final ApplicationService applicationService;
    private final JobService jobService;
    private final CurrentUserService currentUserService;

    public PDFExportService(ApplicationService applicationService, JobService jobService, CurrentUserService currentUserService) {
        this.applicationService = applicationService;
        this.jobService = jobService;
        this.currentUserService = currentUserService;
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
        UUID jobId = app.jobId();
        JobDetailDTO job = jobService.getJobDetails(jobId);
        var user = currentUserService.getUser();
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";

        String fullName = (firstName + " " + lastName).trim();

        PDFBuilder builder = new PDFBuilder(labels.get("headline") + "'" + app.jobTitle() + "'");

        builder
            .addHeaderItem(labels.get("applicationBy") + fullName + labels.get("forPosition") + "'" + app.jobTitle() + "'")
            .addHeaderItem(labels.get("status") + UiTextFormatter.formatEnumValue(app.applicationState()));

        // Overview Section
        builder
            .setOverviewTitle(labels.get("overview"))
            .addOverviewItem(labels.get("supervisor"), getValue(app.supervisingProfessorName()))
            .addOverviewItem(labels.get("researchGroup"), getValue(app.researchGroup()))
            .addOverviewItem(labels.get("location"), getValue(app.jobLocation()))
            .addOverviewItem(labels.get("fieldsOfStudies") + ":", getValue(job.fieldOfStudies()))
            .addOverviewItem(labels.get("researchArea") + ":", getValue(job.researchArea()))
            .addOverviewItem(labels.get("workload") + ":", formatWorkload(job.workload(), labels.get("hoursPerWeek")))
            .addOverviewItem(labels.get("duration") + ":", formatContractDuration(job.contractDuration(), labels.get("years")))
            .addOverviewItem(labels.get("fundingType") + ":", getValue(job.fundingType()))
            .addOverviewItem(labels.get("startDate") + ":", formatDate(job.startDate()))
            .setOverviewDescriptionTitle(labels.get("jobDescription"))
            .setOverviewDescription(job.description());

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
            .addSectionData(labels.get("upperGradeLimit"), getValue(app.applicant().bachelorGradeUpperLimit()))
            .addSectionData(labels.get("lowerGradeLimit"), getValue(app.applicant().bachelorGradeLowerLimit()))
            .addSectionData(labels.get("grade"), getValue(app.applicant().bachelorGrade()));

        // Master Section
        if (app.applicant().masterDegreeName() != null) {
            builder
                .startInfoSection(labels.get("masterInfo"))
                .addSectionData(labels.get("degreeName"), getValue(app.applicant().masterDegreeName()))
                .addSectionData(labels.get("university"), getValue(app.applicant().masterUniversity()))
                .addSectionData(labels.get("upperGradeLimit"), getValue(app.applicant().masterGradeUpperLimit()))
                .addSectionData(labels.get("lowerGradeLimit"), getValue(app.applicant().masterGradeLowerLimit()))
                .addSectionData(labels.get("grade"), getValue(app.applicant().masterGrade()));
        }

        // Metadata
        String metadataText = buildMetadataText(labels);
        builder.setMetadata(metadataText);

        builder.setPageLabels(labels.get("page"), labels.get("of"));

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

    /**
     * Builds the metadata text using labels and current user data
     *
     * @param labels translation labels for metadata parts
     * @return formatted metadata string
     */
    private String buildMetadataText(Map<String, String> labels) {
        StringBuilder metadata = new StringBuilder();

        String currentDateTime = LocalDateTime.now().format(DATETIME_FORMATTER);
        metadata.append(labels.get("thisDocumentWasGeneratedOn"));
        metadata.append(currentDateTime);

        Optional<String> userName = getCurrentUserFullName();
        if (userName.isPresent()) {
            metadata.append(labels.get("byUser"));
            metadata.append(userName.get());
        }

        metadata.append(labels.get("usingTumapply"));

        return metadata.toString();
    }

    /**
     * Gets the full name of the current user if available
     *
     * @return Optional containing the user's full name, or empty if not available
     */
    private Optional<String> getCurrentUserFullName() {
        try {
            var user = currentUserService.getUser();
            String firstName = user.getFirstName() != null ? user.getFirstName() : "";
            String lastName = user.getLastName() != null ? user.getLastName() : "";

            String fullName = (firstName + " " + lastName).trim();

            return fullName.isEmpty() ? Optional.empty() : Optional.of(fullName);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    // Helper methods

    private String getValue(String value) {
        return (value != null && !value.isEmpty()) ? value : "-";
    }

    private String formatDate(Object date) {
        if (date == null) return "-";
        if (date instanceof java.time.LocalDate localDate) {
            return localDate.format(DATE_FORMATTER);
        }
        return date.toString();
    }

    private String formatWorkload(Integer workload, String unit) {
        return workload != null ? workload + (" " + unit) : "-";
    }

    private String formatContractDuration(Integer duration, String unit) {
        return duration != null ? duration + (" " + unit) : "-";
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "document";
        return filename.replaceAll("[^a-zA-Z0-9-_]", "_").substring(0, Math.min(filename.length(), 50));
    }
}
