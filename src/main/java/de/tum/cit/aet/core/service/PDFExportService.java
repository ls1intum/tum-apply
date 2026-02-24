package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.core.dto.JobOverviewData;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.util.PDFBuilder;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PDFExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final JobService jobService;
    private final CurrentUserService currentUserService;
    private final ImageService imageService;

    private final UserRepository userRepository;

    // ------------------- Main methods -------------------

    /**
     * Exports application details to PDF
     *
     * @param app    the ApplicationDetailDTO containing application data
     * @param labels translation labels for PDF content
     * @return the PDF file as Resource
     */
    public Resource exportApplicationToPDF(ApplicationDetailDTO app, Map<String, String> labels) {
        PDFBuilder builder = new PDFBuilder(labels.get("headline") + "'" + app.jobTitle() + "'");

        builder
            .addHeaderItem(
                labels.get("applicationBy") +
                    currentUserService.getCurrentUserFullName() +
                    labels.get("forPosition") +
                    "'" +
                    app.jobTitle() +
                    "'"
            )
            .addHeaderItem(labels.get("status") + UiTextFormatter.formatEnumValue(app.applicationState()));

        if (app.jobId() != null) {
            JobDetailDTO job = jobService.getJobDetails(app.jobId());
            // Overview Section if no in preview
            builder
                .setOverviewTitle(labels.get("overview"))
                .addOverviewItem(labels.get("supervisor"), getValue(app.supervisingProfessorName()))
                .addOverviewItem(labels.get("researchGroup"), getValue(app.researchGroup()))
                .addOverviewItem(labels.get("location"), getValue(app.jobLocation()))
                .addOverviewItem(labels.get("fieldsOfStudies"), getValue(job.fieldOfStudies()))
                .addOverviewItem(labels.get("researchArea"), getValue(job.researchArea()))
                .addOverviewItem(labels.get("workload"), formatWorkload(job.workload(), labels.get("hoursPerWeek")))
                .addOverviewItem(labels.get("duration"), formatContractDuration(job.contractDuration(), labels.get("years")))
                .addOverviewItem(labels.get("fundingType"), getValue(job.fundingType()))
                .addOverviewItem(labels.get("startDate"), formatDate(job.startDate()))
                .addOverviewItem(labels.get("endDate"), formatDate(job.endDate()))
                .setOverviewDescriptionTitle(labels.get("jobDescription"))
                .setOverviewDescription(job.jobDescriptionEN());
        }

        // Personal Statements Group
        builder.startSectionGroup(labels.get("personalStatements"));
        builder.startInfoSection(labels.get("motivation")).addSectionContent(getValue(app.motivation()));
        builder.startInfoSection(labels.get("skills")).addSectionContent(getValue(app.specialSkills()));
        builder.startInfoSection(labels.get("researchExperience")).addSectionContent(getValue(app.projects()));

        // Personal Information Group
        builder.startSectionGroup(labels.get("personalInformation"));

        builder
            .startInfoSection(labels.get("applicantInfo"))
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

        // Metadata
        String metadataText = buildMetadataText(labels);
        builder.setMetadata(metadataText);
        builder.setMetadataEnd(labels.get("metaEndText"));

        builder.setPageLabels(labels.get("page"), labels.get("of"));

        return builder.build();
    }

    /**
     * Exports job details to PDF
     *
     * @param jobId  the job ID
     * @param labels translation labels for PDF content
     * @return the PDF file as Resource
     */
    public Resource exportJobToPDF(UUID jobId, Map<String, String> labels) {
        JobDetailDTO job = jobService.getJobDetails(jobId);

        PDFBuilder builder = new PDFBuilder(job.title());

        // Add banner image if available
        if (job.imageId() != null) {
            try {
                byte[] imageBytes = imageService.getImageBytes(job.imageId());
                builder.setBannerImage(imageBytes);
            } catch (Exception e) {
                log.debug("Could not load banner image for job PDF export: {}", e.getMessage());
            }
        }

        builder.addHeaderItem(labels.get("jobBy") + job.supervisingProfessorName() + labels.get("forJob") + "'" + job.title() + "'");
        try {
            if (currentUserService.isProfessor() || currentUserService.isEmployee()) {
                builder.addHeaderItem(labels.get("status") + UiTextFormatter.formatEnumValue(job.state()));
            }
        } catch (Exception e) {
            log.debug("User not needed to see job status in PDF export as it's always published for them.");
        }

        // Overview Section
        addJobOverview(
            builder,
            labels,
            new JobOverviewData(
                job.supervisingProfessorName(),
                job.location(),
                job.fieldOfStudies(),
                job.researchArea(),
                formatWorkload(job.workload(), labels.get("hoursPerWeek")),
                formatContractDuration(job.contractDuration(), labels.get("years")),
                getValue(job.fundingType()),
                formatDate(job.startDate()),
                formatDate(job.endDate())
            )
        );

        // Determine job description language and content
        String lang = labels.getOrDefault("lang", "en");
        String descriptionForExport = selectJobDescriptionForLang(job.jobDescriptionEN(), job.jobDescriptionDE(), lang);

        // Job Details Section
        addJobDetailsSection(builder, labels, descriptionForExport);

        // Research Group Section
        addResearchGroupSection(builder, job.researchGroup(), labels);

        // Metadata
        String metadataText = buildMetadataText(labels);
        builder.setMetadata(metadataText);
        builder.setMetadataEnd(labels.get("metaEndText"));

        builder.setPageLabels(labels.get("page"), labels.get("of"));

        return builder.build();
    }

    /**
     * Exports job details to PDF
     *
     * @param jobFormDTO the job form data
     * @param labels     translation labels for PDF content
     * @return the PDF file as Resource
     */
    public Resource exportJobPreviewToPDF(JobFormDTO jobFormDTO, Map<String, String> labels) {
        PDFBuilder builder = new PDFBuilder(jobFormDTO.title());

        // Add banner image if available
        if (jobFormDTO.imageId() != null) {
            try {
                byte[] imageBytes = imageService.getImageBytes(jobFormDTO.imageId());
                builder.setBannerImage(imageBytes);
            } catch (Exception e) {
                log.debug("Could not load banner image for job preview PDF export: {}", e.getMessage());
            }
        }

        String supervisingProfessorName = userRepository
            .findById(jobFormDTO.supervisingProfessor())
            .map(user -> (user.getFirstName() + " " + user.getLastName()).trim())
            .orElse("-");

        builder
            .addHeaderItem(labels.get("jobBy") + supervisingProfessorName + labels.get("forJob") + "'" + jobFormDTO.title() + "'")
            .addHeaderItem(labels.get("status") + UiTextFormatter.formatEnumValue(jobFormDTO.state()));

        // Overview Section
        addJobOverview(
            builder,
            labels,
            new JobOverviewData(
                supervisingProfessorName,
                UiTextFormatter.formatEnumValue(jobFormDTO.location()),
                jobFormDTO.fieldOfStudies(),
                jobFormDTO.researchArea(),
                jobFormDTO.workload() != null ? jobFormDTO.workload() + labels.get("hoursPerWeek") : "-",
                jobFormDTO.contractDuration() != null ? jobFormDTO.contractDuration() + labels.get("years") : "-",
                jobFormDTO.fundingType() != null ? jobFormDTO.fundingType().name() : "-",
                jobFormDTO.startDate() != null ? jobFormDTO.startDate().format(DATE_FORMATTER) : "-",
                jobFormDTO.endDate() != null ? jobFormDTO.endDate().format(DATE_FORMATTER) : "-"
            )
        );

        // Determine job description based on requested language
        String lang = labels.getOrDefault("lang", "en");
        String descriptionForExport = selectJobDescriptionForLang(jobFormDTO.jobDescriptionEN(), jobFormDTO.jobDescriptionDE(), lang);

        // Job Details Section
        addJobDetailsSection(builder, labels, descriptionForExport);

        // Metadata
        builder.setMetadata(buildMetadataText(labels));
        builder.setMetadataEnd(labels.get("metaEndText"));
        builder.setPageLabels(labels.get("page"), labels.get("of"));

        try {
            ResearchGroup group = currentUserService.getResearchGroupIfProfessor();
            addResearchGroupSection(builder, group, labels);
        } catch (AccessDeniedException ignored) {
            log.debug("Nothing is added if there is no research group information.");
        }

        return builder.build();
    }

    // ------------------- Helper methods -------------------

    private void addJobOverview(PDFBuilder builder, Map<String, String> labels, JobOverviewData data) {
        builder
            .setOverviewTitle(labels.get("overview"))
            .addOverviewItem(labels.get("supervisor"), getValue(data.supervisor()))
            .addOverviewItem(labels.get("location"), getValue(data.location()))
            .addOverviewItem(labels.get("fieldsOfStudies"), getValue(data.fieldsOfStudies()))
            .addOverviewItem(labels.get("researchArea"), getValue(data.researchArea()))
            .addOverviewItem(labels.get("workload"), getValue(data.workload()))
            .addOverviewItem(labels.get("duration"), getValue(data.duration()))
            .addOverviewItem(labels.get("fundingType"), getValue(data.fundingType()))
            .addOverviewItem(labels.get("startDate"), getValue(data.startDate()))
            .addOverviewItem(labels.get("endDate"), getValue(data.endDate()));
    }

    private void addJobDetailsSection(PDFBuilder builder, Map<String, String> labels, String jobDescription) {
        builder.startSectionGroup(labels.get("jobDetails"));

        builder.startInfoSection(labels.get("description")).addSectionContent(getValue(jobDescription));
    }

    private void addResearchGroupSection(PDFBuilder builder, ResearchGroup group, Map<String, String> labels) {
        builder.startSectionGroup(labels.get("researchGroup"));

        addResearchGroupMainInfo(builder, group);
        addResearchGroupContactInfo(builder, group, labels);
    }

    private void addResearchGroupMainInfo(PDFBuilder builder, ResearchGroup group) {
        builder.startInfoSection(group.getName()).addSectionContent(getValue(group.getDescription()));
    }

    private void addResearchGroupContactInfo(PDFBuilder builder, ResearchGroup group, Map<String, String> labels) {
        String address = formatAddress(group.getStreet(), group.getPostalCode(), group.getCity());
        Map<String, String> items = new LinkedHashMap<>();

        if (hasValue(address)) {
            items.put(labels.get("address"), address);
        }
        if (hasValue(group.getEmail())) {
            items.put(labels.get("email"), group.getEmail());
        }
        if (hasValue(group.getWebsite())) {
            items.put(labels.get("website"), group.getWebsite());
        }

        if (items.isEmpty()) {
            return;
        }

        builder.startInfoSection(labels.get("contactDetails"));
        items.forEach(builder::addSectionData);
    }

    private boolean hasValue(String value) {
        return value != null && !value.isEmpty();
    }

    /**
     * Generates filename for application PDF
     *
     * @param jobTitle         the title of the job of the application
     * @param applicationLabel label for application used as ending of the filename
     * @return sanitized filename for the PDF
     */
    public String generateApplicationFilename(String jobTitle, String applicationLabel) {
        return sanitizeFilename(jobTitle) + "_" + applicationLabel + ".pdf";
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

        Optional<String> userName = currentUserService.getCurrentUserFullNameIfAvailable();
        if (userName.isPresent()) {
            metadata.append(labels.get("byUser"));
            metadata.append(userName.get());
        }

        metadata.append(labels.get("usingTumapply"));

        return metadata.toString();
    }

    /**
     * Generates filename for job PDF
     *
     * @param jobId    the job ID
     * @param jobLabel label for application used as ending of the filename
     * @return sanitized filename for the PDF
     */
    public String generateJobFilename(UUID jobId, String jobLabel) {
        JobDetailDTO job = jobService.getJobDetails(jobId);
        return sanitizeFilename(job.title()) + "_" + jobLabel + ".pdf";
    }

    /**
     * Generates filename for job PDF
     *
     * @param jobFormDTO the job form data
     * @param jobLabel   label for application used as ending of the filename
     * @return sanitized filename for the PDF
     */
    public String generateJobFilenameForPreview(JobFormDTO jobFormDTO, String jobLabel) {
        return sanitizeFilename(jobFormDTO.title()) + "_" + jobLabel + ".pdf";
    }

    // Helper methods

    private String getValue(String value) {
        return (value != null && !value.isEmpty()) ? value : "-";
    }

    String formatDate(Object date) {
        if (date == null) {
            return "-";
        }
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
        if (filename == null) {
            return "document";
        }
        return filename.replaceAll("[^a-zA-Z0-9-_]", "_").substring(0, Math.min(filename.length(), 50));
    }

    private String formatAddress(String street, String postalCode, String city) {
        List<String> parts = new ArrayList<>();

        if (hasValue(street)) {
            parts.add(street);
        }

        List<String> postalCodeParts = new ArrayList<>();
        if (hasValue(postalCode)) {
            postalCodeParts.add(postalCode);
        }
        if (hasValue(city)) {
            postalCodeParts.add(city);
        }

        if (!postalCodeParts.isEmpty()) {
            parts.add(String.join(" ", postalCodeParts));
        }

        return String.join(", ", parts);
    }

    /**
     * Returns the job description string for the requested language. Falls back to the other language if empty.
     * If both are empty, returns "-".
     */
    private String selectJobDescriptionForLang(String en, String de, String lang) {
        if ("de".equalsIgnoreCase(lang)) {
            if (de != null && !de.trim().isEmpty()) return de;
            if (en != null && !en.trim().isEmpty()) return en;
            return "-";
        }
        // default to English
        if (en != null && !en.trim().isEmpty()) return en;
        if (de != null && !de.trim().isEmpty()) return de;
        return "-";
    }

}
