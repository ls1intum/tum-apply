package de.tum.cit.aet.core.service.export.admin;

import tools.jackson.databind.ObjectMapper;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminApplicationReviewDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminCustomFieldAnswerDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminCustomFieldDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminDocumentRefDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminInternalCommentDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminInterviewSlotDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminIntervieweeDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminJobExportDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminRatingDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.PDFExportService;
import de.tum.cit.aet.core.service.ZipExportService;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.evaluation.domain.Rating;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.CustomField;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/**
 * Builds the jobs portion of an admin bulk export. Handles the three job-centric
 * cases that share the same folder structure but differ in their job filter and
 * whether draft applications are included:
 *
 * <ul>
 *   <li>{@link AdminExportType#JOBS_OPEN} – {@code PUBLISHED} with deadline in the
 *       future or null; <strong>excludes</strong> draft applications.</li>
 *   <li>{@link AdminExportType#JOBS_EXPIRED} – {@code PUBLISHED} with deadline in the
 *       past; includes drafts.</li>
 *   <li>{@link AdminExportType#JOBS_CLOSED} – {@code CLOSED} or {@code APPLICANT_FOUND};
 *       includes drafts.</li>
 * </ul>
 *
 * <p>This strategy is also reused by {@link FullAdminExportStrategy} via the
 * {@link #writeJobsInto(ZipOutputStream, String, List, boolean)} entry point so
 * the same folder layout is produced under {@code research_groups/<rg>/jobs/}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JobsExportStrategy {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final RatingRepository ratingRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final PDFExportService pdfExportService;
    private final ZipExportService zipExportService;
    private final AdminXlsxWriter xlsxWriter;
    private final ObjectMapper objectMapper;

    /**
     * Top-level entry point used by {@link AdminExportZipWriter} for the three
     * jobs-only export cases. Discovers all jobs matching the type's filter,
     * writes them at the root of the ZIP and emits a top-level overview workbook
     * plus a re-importable JSON dump.
     *
     * @param zos  open ZIP output stream rooted at the top of the export
     * @param type which jobs-only case to apply ({@code JOBS_OPEN}, {@code JOBS_EXPIRED} or {@code JOBS_CLOSED})
     */
    public void exportJobs(ZipOutputStream zos, AdminExportType type) {
        List<Job> jobs = filterJobs(jobRepository.findAll(), type);
        boolean includeDrafts = type != AdminExportType.JOBS_OPEN;
        // Per-type exports go to research groups; UUIDs would be noise.
        writeJobsInternal(zos, "", jobs, includeDrafts, false);
    }

    /**
     * Writes a list of jobs into a sub-path of the ZIP, mirroring the same layout
     * used at the root by {@link #exportJobs}. Used by both the full admin export
     * (which keeps UUIDs and drafts) and the research-groups export (which embeds
     * each group's jobs without UUIDs and without drafts).
     *
     * @param zos            open ZIP output stream
     * @param basePath       prefix inside the ZIP, ending in {@code "/"} or empty
     * @param jobs           jobs to write
     * @param includeDrafts  whether to include {@code SAVED} applications
     * @param includeUuids   whether to suffix folder names with the entity's short UUID
     */
    void writeJobsInto(
        ZipOutputStream zos,
        String basePath,
        List<Job> jobs,
        boolean includeDrafts,
        boolean includeUuids
    ) {
        writeJobsInternal(zos, basePath, jobs, includeDrafts, includeUuids);
    }

    private void writeJobsInternal(
        ZipOutputStream zos,
        String basePath,
        List<Job> jobs,
        boolean includeDrafts,
        boolean includeUuids
    ) {
        FolderNameAllocator jobAllocator = new FolderNameAllocator(includeUuids);
        for (Job job : jobs) {
            String folder = basePath + "job_" + jobAllocator.allocate(job.getTitle(), job.getJobId()) + "/";
            try {
                writeJobFolder(zos, folder, job, includeDrafts, includeUuids);
            } catch (Exception e) {
                // Defensive: one bad job (e.g. corrupt entity, missing relation) must
                // never abort the surrounding ZIP. Drop a placeholder and continue.
                log.error("Failed to write job folder for job {} ({}): {}", job.getJobId(), job.getTitle(), e.getMessage(), e);
                writeTextEntry(
                    zos,
                    folder + "_error.txt",
                    "Failed to export job " + job.getJobId() + ": " + e.getMessage()
                );
            }
        }
        if (!jobs.isEmpty()) {
            writeJobsOverviewSheet(zos, basePath + "jobs_overview.xlsx", jobs);
            writeJsonEntry(zos, basePath + "_machine_readable/jobs.json", jobs.stream().map(this::toJobDto).toList());
        }

        // TODO(post-export-go-live): dispatch JOB_EXPORT_NOTIFICATION to all
        // members of each job.researchGroup, and (only for JOBS_OPEN) dispatch
        // DRAFT_APPLICATION_REMINDER to applicants who currently hold a SAVED
        // application against any job in `jobs`. Recipient computation belongs
        // here so the actual sending is a one-line change later.
    }

    // ----------------------------- filtering -----------------------------

    /**
     * Filters a list of jobs to those matching the given admin export type, in the
     * same way the standalone exports do. Exposed for {@link FullAdminExportStrategy}
     * so it can split a research group's jobs into open / expired / closed buckets.
     *
     * @param jobs candidate jobs
     * @param type which admin export bucket to apply
     * @return jobs that satisfy the type's filter, sorted newest-first
     */
    List<Job> filterJobs(List<Job> jobs, AdminExportType type) {
        LocalDate today = LocalDate.now();
        return jobs
            .stream()
            .filter(job -> matchesType(job, type, today))
            .sorted(Comparator.comparing(Job::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .toList();
    }

    private boolean matchesType(Job job, AdminExportType type, LocalDate today) {
        return switch (type) {
            case JOBS_OPEN -> job.getState() == JobState.PUBLISHED && (job.getEndDate() == null || !job.getEndDate().isBefore(today));
            case JOBS_EXPIRED -> job.getState() == JobState.PUBLISHED && job.getEndDate() != null && job.getEndDate().isBefore(today);
            case JOBS_CLOSED -> EnumSet.of(JobState.CLOSED, JobState.APPLICANT_FOUND).contains(job.getState());
            // Full admin export funnels every job through here too, with no extra filter.
            case FULL_ADMIN -> true;
        };
    }

    // ----------------------------- per-job tree -----------------------------

    private void writeJobFolder(ZipOutputStream zos, String folder, Job job, boolean includeDrafts, boolean includeUuids) {
        // 1. Job details PDF (reuses existing public job-export PDF)
        try {
            Resource pdf = pdfExportService.exportJobToPDF(job.getJobId(), AdminPdfLabels.forJob());
            zipExportService.addFileToZip(zos, folder + "job_details.pdf", pdf.getInputStream());
        } catch (Exception e) {
            log.warn("Failed to write job_details.pdf for job {}: {}", job.getJobId(), e.getMessage());
            writeTextEntry(zos, folder + "job_details.pdf.error.txt", "Failed to render PDF: " + e.getMessage());
        }

        // 2. Fetch applications via an explicit query (avoids lazy-collection /
        // second-level-cache quirks that can return a stale subset of the rows)
        // and filter according to the includeDrafts flag.
        List<Application> rawApps = applicationRepository.findAllByJobId(job.getJobId());
        List<Application> apps = rawApps
            .stream()
            .filter(a -> includeDrafts || a.getState() != ApplicationState.SAVED)
            .sorted(Comparator.comparing(Application::getApplicantLastName, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
        if (rawApps.size() != apps.size()) {
            log.debug(
                "Job {} ({}): fetched {} applications, exporting {} after draft filter (includeDrafts={})",
                job.getJobId(),
                job.getTitle(),
                rawApps.size(),
                apps.size(),
                includeDrafts
            );
        }

        // 3. Per-job overview xlsx + machine-readable applications dump
        writeApplicationsOverviewSheet(zos, folder + "applications_overview.xlsx", apps);
        writeJsonEntry(zos, folder + "_machine_readable/job.json", toJobDto(job));
        writeJsonEntry(
            zos,
            folder + "_machine_readable/applications.json",
            apps.stream().map(this::toApplicationDto).toList()
        );

        // 4. One folder per application — fresh allocator scoped to this job
        FolderNameAllocator appAllocator = new FolderNameAllocator(includeUuids);
        for (Application app : apps) {
            String label = (app.getApplicantLastName() == null ? "applicant" : app.getApplicantLastName()) +
                "_" +
                (app.getApplicantFirstName() == null ? "" : app.getApplicantFirstName());
            String appFolder = folder + "applications/" + appAllocator.allocate(label, app.getApplicationId()) + "/";
            writeApplicationFolder(zos, appFolder, app, job);
        }
    }

    private void writeApplicationFolder(ZipOutputStream zos, String folder, Application app, Job job) {
        // 1. Application details PDF (reuses existing per-applicant PDF)
        try {
            ApplicationDetailDTO dto = ApplicationDetailDTO.getFromEntity(app, job);
            Resource pdf = pdfExportService.exportApplicationToPDF(dto, AdminPdfLabels.forApplication());
            zipExportService.addFileToZip(zos, folder + "application_details.pdf", pdf.getInputStream());
        } catch (Exception e) {
            log.warn("Failed to write application_details.pdf for {}: {}", app.getApplicationId(), e.getMessage());
            writeTextEntry(zos, folder + "application_details.pdf.error.txt", "Failed to render PDF: " + e.getMessage());
        }

        // 2. Machine-readable JSON (review, ratings, comments — interview data lives in
        // its own subfolder below so it can be browsed/diffed independently).
        writeJsonEntry(zos, folder + "_machine_readable/application.json", toApplicationDto(app));

        // 3. Interview subfolder, only when interview data exists for this application.
        Interviewee interviewee = lookupInterviewee(app);
        if (interviewee != null) {
            writeJsonEntry(zos, folder + "interview/interview.json", toIntervieweeDto(interviewee));
            try {
                Resource interviewPdf = AdminInterviewPdf.build(interviewee, app, job);
                zipExportService.addFileToZip(zos, folder + "interview/interview_summary.pdf", interviewPdf.getInputStream());
            } catch (Exception e) {
                log.warn(
                    "Failed to write interview_summary.pdf for application {}: {}",
                    app.getApplicationId(),
                    e.getMessage()
                );
                writeTextEntry(
                    zos,
                    folder + "interview/interview_summary.pdf.error.txt",
                    "Failed to render interview PDF: " + e.getMessage()
                );
            }
        }

        // 4. Applicant documents (binary files). Filenames are derived from the
        // DocumentType enum (cv, bachelor_transcript, …) rather than from the
        // free-form name column — that column is unreliable in test data and
        // sometimes literally just says "PDF", which produced double-extension
        // names like "pdf.pdf". A FolderNameAllocator deduplicates if the same
        // applicant has multiple files of the same type (cv.pdf, cv_2.pdf, …).
        // Catch every exception per file so a missing/corrupted blob never
        // aborts the surrounding ZIP stream.
        Set<DocumentDictionary> docDicts = app.getDocumentDictionaries() == null ? Set.of() : app.getDocumentDictionaries();
        FolderNameAllocator docAllocator = new FolderNameAllocator(false);
        for (DocumentDictionary dd : docDicts) {
            if (dd.getDocument() == null) {
                continue;
            }
            String typeLabel = dd.getDocumentType() == null ? "document" : dd.getDocumentType().name().toLowerCase(java.util.Locale.ROOT);
            String baseName = docAllocator.allocate(typeLabel, dd.getDocument().getDocumentId());
            String filename = baseName + AdminExportNaming.extensionForMime(dd.getDocument().getMimeType());
            try {
                zipExportService.addDocumentToZip(zos, folder + "documents/" + filename, dd.getDocument());
            } catch (Exception e) {
                log.warn(
                    "Failed to add document {} for application {}: {}",
                    dd.getDocument().getDocumentId(),
                    app.getApplicationId(),
                    e.getMessage()
                );
                writeTextEntry(
                    zos,
                    folder + "documents/" + filename + ".error.txt",
                    "Failed to load document " + dd.getDocument().getDocumentId() + ": " + e.getMessage()
                );
            }
        }
    }

    // ----------------------------- overview sheets -----------------------------

    private void writeJobsOverviewSheet(ZipOutputStream zos, String entryPath, List<Job> jobs) {
        List<String> headers = List.of(
            "Job ID",
            "Title",
            "State",
            "Supervising Professor",
            "Research Group",
            "Subject Area",
            "Location",
            "Start Date",
            "Application Deadline",
            "Application Count",
            "Created"
        );
        List<List<Object>> rows = new ArrayList<>(jobs.size());
        for (Job job : jobs) {
            rows.add(
                List.<Object>of(
                    nullSafe(job.getJobId()),
                    nullSafe(job.getTitle()),
                    nullSafe(job.getState()),
                    job.getSupervisingProfessor() == null
                        ? ""
                        : (nullSafe(job.getSupervisingProfessor().getFirstName()) + " " + nullSafe(job.getSupervisingProfessor().getLastName())).trim(),
                    job.getResearchGroup() == null ? "" : nullSafe(job.getResearchGroup().getName()),
                    job.getSubjectArea() == null ? "" : job.getSubjectArea().name(),
                    job.getLocation() == null ? "" : job.getLocation().name(),
                    nullSafe(job.getStartDate()),
                    nullSafe(job.getEndDate()),
                    applicationRepository.findAllByJobId(job.getJobId()).size(),
                    nullSafe(job.getCreatedAt())
                )
            );
        }
        xlsxWriter.writeSheet(zos, entryPath, "Jobs", headers, rows);
    }

    private void writeApplicationsOverviewSheet(ZipOutputStream zos, String entryPath, List<Application> apps) {
        List<String> headers = List.of(
            "Application ID",
            "Last Name",
            "First Name",
            "Email",
            "State",
            "Average Rating",
            "Interview Rating",
            "Interview Date",
            "Interview Location",
            "Interview Notes",
            "Applied At",
            "Desired Start Date",
            "Bachelor Degree",
            "Bachelor University",
            "Bachelor Grade",
            "Master Degree",
            "Master University",
            "Master Grade"
        );
        List<List<Object>> rows = new ArrayList<>(apps.size());
        for (Application app : apps) {
            Set<Rating> ratings = ratingRepository.findByApplicationApplicationId(app.getApplicationId());
            Double avg = ratings.isEmpty()
                ? null
                : ratings.stream().filter(r -> r.getRating() != null).mapToInt(Rating::getRating).average().orElse(0d);
            Interviewee interviewee = lookupInterviewee(app);
            String interviewRating = interviewee == null || interviewee.getRating() == null ? "" : interviewee.getRating().name();
            InterviewSlot slot = interviewee == null ? null : interviewee.getScheduledSlot();
            Object interviewDate = slot == null ? "" : slot.getStartDateTime();
            String interviewLocation = slot == null ? "" : nullSafeString(slot.getLocation());
            String interviewNotes = interviewee == null ? "" : truncate(nullSafeString(interviewee.getAssessmentNotes()), 500);
            rows.add(
                List.<Object>of(
                    nullSafe(app.getApplicationId()),
                    nullSafe(app.getApplicantLastName()),
                    nullSafe(app.getApplicantFirstName()),
                    nullSafe(app.getApplicantEmail()),
                    nullSafe(app.getState()),
                    avg == null ? "" : avg,
                    interviewRating,
                    interviewDate,
                    interviewLocation,
                    interviewNotes,
                    nullSafe(app.getAppliedAt()),
                    nullSafe(app.getDesiredStartDate()),
                    nullSafe(app.getApplicantBachelorDegreeName()),
                    nullSafe(app.getApplicantBachelorUniversity()),
                    nullSafe(app.getApplicantBachelorGrade()),
                    nullSafe(app.getApplicantMasterDegreeName()),
                    nullSafe(app.getApplicantMasterUniversity()),
                    nullSafe(app.getApplicantMasterGrade())
                )
            );
        }
        xlsxWriter.writeSheet(zos, entryPath, "Applications", headers, rows);
    }

    private static String nullSafeString(String value) {
        return value == null ? "" : value;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() > max ? value.substring(0, max) + "…" : value;
    }

    // ----------------------------- DTO conversion -----------------------------

    AdminJobExportDTO toJobDto(Job job) {
        List<AdminCustomFieldDTO> customFields = job.getCustomFields() == null
            ? List.of()
            : job
                .getCustomFields()
                .stream()
                .map(this::toCustomFieldDto)
                .toList();
        return new AdminJobExportDTO(
            job.getJobId(),
            job.getSupervisingProfessor() == null ? null : job.getSupervisingProfessor().getUserId(),
            job.getResearchGroup() == null ? null : job.getResearchGroup().getResearchGroupId(),
            job.getTitle(),
            job.getState(),
            job.getSubjectArea(),
            job.getResearchArea(),
            job.getLocation(),
            job.getWorkload(),
            job.getContractDuration(),
            job.getFundingType(),
            job.getJobDescriptionEN(),
            job.getJobDescriptionDE(),
            job.getStartDate(),
            job.getEndDate(),
            job.getSuitableForDisabled(),
            customFields,
            job.getCreatedAt(),
            job.getLastModifiedAt()
        );
    }

    private AdminCustomFieldDTO toCustomFieldDto(CustomField cf) {
        return new AdminCustomFieldDTO(
            cf.getCustomFieldId(),
            cf.getQuestion(),
            cf.isRequired(),
            cf.getCustomFieldType(),
            cf.getAnswerOptions(),
            cf.getSequence()
        );
    }

    AdminApplicationExportDTO toApplicationDto(Application app) {
        ApplicationReview review = app.getApplicationReview();
        AdminApplicationReviewDTO reviewDto = review == null
            ? null
            : new AdminApplicationReviewDTO(
                review.getApplicationReviewId(),
                review.getReviewedBy() == null ? null : review.getReviewedBy().getUserId(),
                review.getReason(),
                review.getReviewedAt()
            );

        Set<Rating> ratings = ratingRepository.findByApplicationApplicationId(app.getApplicationId());
        List<AdminRatingDTO> ratingDtos = ratings
            .stream()
            .map(r ->
                new AdminRatingDTO(
                    r.getRatingId(),
                    r.getFrom() == null ? null : r.getFrom().getUserId(),
                    r.getRating(),
                    r.getCreatedAt()
                )
            )
            .toList();

        Set<InternalComment> comments = app.getInternalComments() == null ? Set.of() : app.getInternalComments();
        List<AdminInternalCommentDTO> commentDtos = comments
            .stream()
            .map(c ->
                new AdminInternalCommentDTO(
                    c.getInternalCommentId(),
                    c.getCreatedBy() == null ? null : c.getCreatedBy().getUserId(),
                    c.getMessage(),
                    c.getCreatedAt()
                )
            )
            .toList();

        Set<CustomFieldAnswer> answers = app.getCustomFieldAnswers() == null ? Set.of() : app.getCustomFieldAnswers();
        List<AdminCustomFieldAnswerDTO> answerDtos = answers
            .stream()
            .map(a ->
                new AdminCustomFieldAnswerDTO(
                    a.getCustomFieldAnswerId(),
                    a.getCustomField() == null ? null : a.getCustomField().getCustomFieldId(),
                    a.getAnswers()
                )
            )
            .toList();

        // Mirrors the filename allocation in writeApplicationFolder so the JSON's
        // zipPath matches the actual file on disk inside the ZIP.
        Set<DocumentDictionary> docDicts = app.getDocumentDictionaries() == null ? Set.of() : app.getDocumentDictionaries();
        FolderNameAllocator docPathAllocator = new FolderNameAllocator(false);
        List<AdminDocumentRefDTO> docRefs = docDicts
            .stream()
            .filter(dd -> dd.getDocument() != null)
            .map(dd -> {
                String typeLabel = dd.getDocumentType() == null
                    ? "document"
                    : dd.getDocumentType().name().toLowerCase(java.util.Locale.ROOT);
                String baseName = docPathAllocator.allocate(typeLabel, dd.getDocument().getDocumentId());
                return new AdminDocumentRefDTO(
                    dd.getDocument().getDocumentId(),
                    dd.getName(),
                    dd.getDocumentType(),
                    dd.getDocument().getMimeType(),
                    dd.getDocument().getSizeBytes(),
                    "documents/" + baseName + AdminExportNaming.extensionForMime(dd.getDocument().getMimeType())
                );
            })
            .toList();

        // Interview data is intentionally NOT inlined here — it lives in its own
        // sibling file at <applicant_folder>/interview/interview.json so it can
        // be browsed and re-imported independently.
        return new AdminApplicationExportDTO(
            app.getApplicationId(),
            app.getJob() == null ? null : app.getJob().getJobId(),
            app.getApplicant() == null || app.getApplicant().getUser() == null ? null : app.getApplicant().getUser().getUserId(),
            app.getState(),
            app.getDesiredStartDate(),
            app.getAppliedAt(),
            app.getMotivation(),
            app.getSpecialSkills(),
            app.getProjects(),
            app.getApplicantFirstName(),
            app.getApplicantLastName(),
            app.getApplicantEmail(),
            app.getApplicantGender(),
            app.getApplicantNationality(),
            app.getApplicantBirthday(),
            app.getApplicantPhoneNumber(),
            app.getApplicantWebsite(),
            app.getApplicantLinkedinUrl(),
            app.getApplicantStreet(),
            app.getApplicantPostalCode(),
            app.getApplicantCity(),
            app.getApplicantCountry(),
            app.getApplicantBachelorDegreeName(),
            app.getApplicantBachelorGradeUpperLimit(),
            app.getApplicantBachelorGradeLowerLimit(),
            app.getApplicantBachelorGrade(),
            app.getApplicantBachelorUniversity(),
            app.getApplicantMasterDegreeName(),
            app.getApplicantMasterGradeUpperLimit(),
            app.getApplicantMasterGradeLowerLimit(),
            app.getApplicantMasterGrade(),
            app.getApplicantMasterUniversity(),
            reviewDto,
            ratingDtos,
            commentDtos,
            answerDtos,
            docRefs,
            null,
            app.getCreatedAt(),
            app.getLastModifiedAt()
        );
    }

    private AdminIntervieweeDTO toIntervieweeDto(Interviewee interviewee) {
        InterviewProcess process = interviewee.getInterviewProcess();
        List<AdminInterviewSlotDTO> slots = interviewee.getSlots() == null
            ? List.of()
            : interviewee
                .getSlots()
                .stream()
                .map(this::toSlotDto)
                .toList();
        return new AdminIntervieweeDTO(
            interviewee.getId(),
            process == null ? null : process.getId(),
            interviewee.getLastInvited(),
            interviewee.getRating(),
            interviewee.getAssessmentNotes(),
            slots
        );
    }

    private AdminInterviewSlotDTO toSlotDto(InterviewSlot slot) {
        return new AdminInterviewSlotDTO(
            slot.getId(),
            slot.getStartDateTime(),
            slot.getEndDateTime(),
            slot.getLocation(),
            slot.getStreamLink(),
            slot.getIsBooked()
        );
    }

    private Interviewee lookupInterviewee(Application app) {
        if (app.getJob() == null) {
            return null;
        }
        // Each job has at most one InterviewProcess; an applicant joins it as one Interviewee at most.
        return intervieweeRepository
            .findByApplicantUserIdWithDetails(app.getApplicant().getUser().getUserId())
            .stream()
            .filter(i -> i.getInterviewProcess() != null && i.getInterviewProcess().getJob() != null)
            .filter(i -> i.getInterviewProcess().getJob().getJobId().equals(app.getJob().getJobId()))
            .findFirst()
            .orElse(null);
    }

    // ----------------------------- low-level helpers -----------------------------

    private void writeJsonEntry(ZipOutputStream zos, String entryPath, Object payload) {
        try {
            byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            zipExportService.addFileToZip(zos, entryPath, bytes);
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write JSON entry " + entryPath, e);
        }
    }

    private void writeTextEntry(ZipOutputStream zos, String entryPath, String content) {
        try {
            zipExportService.addFileToZip(zos, entryPath, content.getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            log.warn("Failed to write text entry {}: {}", entryPath, e.getMessage());
        }
    }

    private static Object nullSafe(Object value) {
        return value == null ? "" : value;
    }
}
