package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.util.PDFBuilder;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.service.JobService;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class PDFExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final ApplicationService applicationService;
    private final JobService jobService;

    public PDFExportService(ApplicationService applicationService, JobService jobService) {
        this.applicationService = applicationService;
        this.jobService = jobService;
    }

    /**
     * Exports job details to PDF
     */
    public Resource exportJobToPDF(UUID jobId, Map<String, String> labels) {
        JobDetailDTO job = jobService.getJobDetails(jobId);

        PDFBuilder builder = new PDFBuilder(job.title());

        // Overview Section
        builder
            .setOverviewTitle(labels.get("overview"))
            .addOverviewItem(labels.get("supervisor"), getValue(job.supervisingProfessorName()))
            .addOverviewItem(labels.get("researchGroup"), getValue(job.researchGroup().getName()))
            .addOverviewItem(labels.get("location"), getValue(job.location()))
            .addOverviewItem("Field of Studies", getValue(job.fieldOfStudies()))
            .addOverviewItem("Research Area", getValue(job.researchArea()))
            .addOverviewItem("Workload", formatWorkload(job.workload()))
            .addOverviewItem("Contract Duration", formatContractDuration(job.contractDuration()))
            .addOverviewItem("Funding Type", getValue(job.fundingType()))
            .addOverviewItem("Start Date", formatDate(job.startDate()));

        if (job.endDate() != null) {
            builder.addOverviewItem("Application Deadline", formatDate(job.endDate()));
        }

        // Description Section
        if (job.description() != null && !job.description().isEmpty()) {
            builder.startInfoSection("Description").addSectionContent(job.description());
        }

        // Tasks Section
        if (job.tasks() != null && !job.tasks().isEmpty()) {
            builder.startInfoSection("Tasks").addSectionContent(job.tasks());
        }

        // Requirements Section
        if (job.requirements() != null && !job.requirements().isEmpty()) {
            builder.startInfoSection("Requirements").addSectionContent(job.requirements());
        }

        // Research Group Section
        if (job.researchGroup().getDescription() != null && !job.researchGroup().getDescription().isEmpty()) {
            builder.startInfoSection("About " + job.researchGroup().getName()).addSectionContent(job.researchGroup().getDescription());
        }

        // Research Group Contact Info
        builder
            .startInfoSection("Contact Information")
            .addSectionData("Email", getValue(job.researchGroup().getEmail()))
            .addSectionData("Website", getValue(job.researchGroup().getWebsite()))
            .addSectionData(
                "Address",
                formatAddress(job.researchGroup().getStreet(), job.researchGroup().getPostalCode(), job.researchGroup().getCity())
            );

        return builder.build();
    }

    /**
     * Exports application details to PDF
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
        builder.startSectionGroup(labels.get("entity.application_detail.personal_information"));

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

        return builder.build();
    }

    /**
     * Generates filename for job PDF
     */
    public String generateJobFilename(UUID jobId) {
        JobDetailDTO job = jobService.getJobDetails(jobId);
        return sanitizeFilename(job.title()) + "_job.pdf";
    }

    /**
     * Generates filename for application PDF
     */
    public String generateApplicationFilename(UUID applicationId) {
        ApplicationDetailDTO app = applicationService.getApplicationDetail(applicationId);
        return sanitizeFilename(app.jobTitle()) + "_Application.pdf";
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

    private String formatWorkload(Integer workload) {
        return workload != null ? workload + " hours/week" : "-";
    }

    private String formatContractDuration(Integer duration) {
        return duration != null ? duration + " years" : "-";
    }

    private String formatAddress(String street, String postalCode, String city) {
        StringBuilder address = new StringBuilder();
        if (street != null && !street.isEmpty()) {
            address.append(street);
        }
        if (postalCode != null && !postalCode.isEmpty()) {
            if (address.length() > 0) address.append(", ");
            address.append(postalCode);
        }
        if (city != null && !city.isEmpty()) {
            if (address.length() > 0) address.append(" ");
            address.append(city);
        }
        return address.length() > 0 ? address.toString() : "-";
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "document";
        return filename.replaceAll("[^a-zA-Z0-9-_]", "_").substring(0, Math.min(filename.length(), 50));
    }
}
