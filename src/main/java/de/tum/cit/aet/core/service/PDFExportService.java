package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.util.PDFBuilder;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.service.JobService;
import java.time.format.DateTimeFormatter;
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
    public Resource exportJobToPDF(UUID jobId) {
        JobDetailDTO job = jobService.getJobDetails(jobId);

        PDFBuilder builder = new PDFBuilder(job.title())
            .addData("Supervisor", getValue(job.supervisingProfessorName()))
            .addData("Research Group", getValue(job.researchGroup().getName()))
            .addData("Location", getValue(job.location()))
            .addData("", "")
            .addData("Field of Studies", getValue(job.fieldOfStudies()))
            .addData("Research Area", getValue(job.researchArea()))
            .addData("Workload", formatWorkload(job.workload()))
            .addData("Contract Duration", formatContractDuration(job.contractDuration()))
            .addData("Funding Type", getValue(job.fundingType()))
            .addData("Start Date", formatDate(job.startDate()));

        if (job.endDate() != null) {
            builder.addData("Application Deadline", formatDate(job.endDate()));
        }

        builder.addData("", "");

        // HTML Sections
        if (job.description() != null && !job.description().isEmpty()) {
            builder.addSection("Description", job.description());
        }

        if (job.tasks() != null && !job.tasks().isEmpty()) {
            builder.addSection("Tasks", job.tasks());
        }

        if (job.requirements() != null && !job.requirements().isEmpty()) {
            builder.addSection("Requirements", job.requirements());
        }

        builder.addData("", "");

        // Research Group
        if (job.researchGroup().getDescription() != null && !job.researchGroup().getDescription().isEmpty()) {
            builder.addSection("About " + job.researchGroup().getName(), job.researchGroup().getDescription());
        }

        builder
            .addData("Email", getValue(job.researchGroup().getEmail()))
            .addData("Website", getValue(job.researchGroup().getWebsite()))
            .addData(
                "Address",
                formatAddress(job.researchGroup().getStreet(), job.researchGroup().getPostalCode(), job.researchGroup().getCity())
            );

        return builder.build();
    }

    /**
     * Exports application details to PDF
     */
    public Resource exportApplicationToPDF(UUID applicationId) {
        ApplicationDetailDTO app = applicationService.getApplicationDetail(applicationId);

        PDFBuilder builder = new PDFBuilder("Application for " + app.jobTitle())
            .addData("Application State", formatApplicationState(app.applicationState()))
            .addData("", "")
            .addData("Supervisor", getValue(app.supervisingProfessorName()))
            .addData("Research Group", getValue(app.researchGroup()))
            .addData("Location", getValue(app.jobLocation()))
            .addData("", "");

        // Personal Statements
        if (app.motivation() != null && !app.motivation().isEmpty()) {
            builder.addSection("Motivation", app.motivation());
        }

        if (app.specialSkills() != null && !app.specialSkills().isEmpty()) {
            builder.addSection("Special Skills", app.specialSkills());
        }

        if (app.projects() != null && !app.projects().isEmpty()) {
            builder.addSection("Research Experience", app.projects());
        }

        builder.addData("", "");

        // Personal Info
        builder
            .addData("Preferred Language", getValue(app.applicant().user().preferredLanguage()))
            .addData("Desired Start Date", formatDate(app.desiredDate()))
            .addData("Gender", getValue(app.applicant().user().gender()))
            .addData("Nationality", getValue(app.applicant().user().nationality()));

        if (app.applicant().user().website() != null) {
            builder.addData("Website", app.applicant().user().website());
        }
        if (app.applicant().user().linkedinUrl() != null) {
            builder.addData("LinkedIn", app.applicant().user().linkedinUrl());
        }

        // Education
        builder
            .addData("", "")
            .addData("Bachelor Degree", getValue(app.applicant().bachelorDegreeName()))
            .addData("Bachelor University", getValue(app.applicant().bachelorUniversity()))
            .addData("Bachelor Grade", getValue(app.applicant().bachelorGrade()));

        if (app.applicant().masterDegreeName() != null) {
            builder
                .addData("", "")
                .addData("Master Degree", getValue(app.applicant().masterDegreeName()))
                .addData("Master University", getValue(app.applicant().masterUniversity()))
                .addData("Master Grade", getValue(app.applicant().masterGrade()));
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
        return sanitizeFilename(app.jobTitle()) + "_application.pdf";
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

    private String formatApplicationState(ApplicationState state) {
        if (state == null) return "-";
        return switch (state) {
            case SAVED -> "Saved";
            case SENT -> "Sent";
            case ACCEPTED -> "Accepted";
            case IN_REVIEW -> "In Review";
            case REJECTED -> "Rejected";
            case WITHDRAWN -> "Withdrawn";
            case JOB_CLOSED -> "Job Closed";
            default -> "-";
        };
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
