package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.domain.dto.CustomFieldAnswerDetailDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.dto.DocumentRefDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminJobExportDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.core.service.PDFExportService;
import de.tum.cit.aet.core.service.XlsxExportService;
import de.tum.cit.aet.core.service.ZipExportService;
import de.tum.cit.aet.evaluation.domain.Rating;
import de.tum.cit.aet.evaluation.dto.ApplicationReviewDTO;
import de.tum.cit.aet.evaluation.dto.InternalCommentDetailDTO;
import de.tum.cit.aet.evaluation.dto.RatingDetailDTO;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.dto.InterviewDTO;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.CustomFieldDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

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
 * {@link #writeJobsInto(ZipOutputStream, String, List, boolean, boolean, boolean)} entry point so
 * the same folder layout is produced under {@code research_groups/<rg>/jobs/}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JobsExportStrategy {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final ResearchGroupRepository researchGroupRepository;
    private final ResearchGroupsExportStrategy researchGroupsExportStrategy;
    private final RatingRepository ratingRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final PDFExportService pdfExportService;
    private final ZipExportService zipExportService;
    private final DocumentService documentService;
    private final XlsxExportService xlsxWriter;
    private final ObjectMapper objectMapper;

    /**
     * Top-level entry point used by {@link AdminExportZipWriter} for the three
     * jobs-only export cases. Produces a research-group-centric layout (matching
     * the full admin export's per-rg structure) but contains only the relevant
     * job-state bucket and omits all JSON / UUID noise — the per-type exports
     * are handed to research groups directly, who don't need re-importable data.
     *
     * <pre>
     * jobs_&lt;case&gt;/
     * ├── README_*.txt
     * ├── &lt;abbrev&gt;/                 (one folder per research group)
     * │   ├── members_overview.xlsx
     * │   └── jobs/
     * │       ├── jobs_overview.xlsx
     * │       └── job_&lt;slug&gt;/
     * │           ├── job_details.pdf
     * │           ├── applications_overview.xlsx
     * │           └── applications/
     * │               └── &lt;lastname_firstname&gt;/
     * │                   ├── application_details.pdf
     * │                   ├── interview/
     * │                   │   └── interview_summary.pdf
     * │                   └── documents/cv.pdf, ...
     * └── orphans/jobs/...           (jobs without a research group, rare)
     * </pre>
     *
     * @param zos  open ZIP output stream rooted at the top of the export
     * @param type which jobs-only case to apply ({@code JOBS_OPEN}, {@code JOBS_EXPIRED} or {@code JOBS_CLOSED})
     */
    public void exportJobs(ZipOutputStream zos, AdminExportType type) {
        List<Job> matchingJobs = filterJobs(jobRepository.findAll(), type);
        boolean includeDrafts = type != AdminExportType.JOBS_OPEN;

        Map<UUID, List<Job>> jobsByRg = matchingJobs
            .stream()
            .filter(j -> j.getResearchGroup() != null)
            .collect(Collectors.groupingBy(j -> j.getResearchGroup().getResearchGroupId()));

        // Iterate research groups in name order, but only include those that have
        // at least one matching job — otherwise we'd produce empty folders.
        List<ResearchGroup> groups = researchGroupRepository
            .findAll()
            .stream()
            .filter(rg -> jobsByRg.containsKey(rg.getResearchGroupId()))
            .sorted(Comparator.comparing(ResearchGroup::getName, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();

        FolderNameAllocator rgAllocator = new FolderNameAllocator(false);
        for (ResearchGroup rg : groups) {
            // Use the full research group title; abbreviations collide too easily
            // ("AET", null, …) and the slug() helper trims it to a safe length.
            String rgFolder = rgAllocator.allocate(rg.getName(), rg.getResearchGroupId()) + "/";
            // Members XLSX only — no JSON dumps for the human-readable per-type exports.
            researchGroupsExportStrategy.writeGroupFolder(zos, rgFolder, rg, false);
            writeJobsInternal(zos, rgFolder + "jobs/", jobsByRg.get(rg.getResearchGroupId()), includeDrafts, false, false);
        }

        // Defensive: jobs that match the filter but have no research group go
        // into orphans/. Healthy data should leave this empty.
        List<Job> orphanJobs = matchingJobs
            .stream()
            .filter(j -> j.getResearchGroup() == null)
            .toList();
        if (!orphanJobs.isEmpty()) {
            writeJobsInternal(zos, "orphans/jobs/", orphanJobs, includeDrafts, false, false);
        }

        // TODO(post-export-go-live): dispatch JOB_EXPORT_NOTIFICATION to all
        // members of each job.researchGroup, and (only for JOBS_OPEN) dispatch
        // DRAFT_APPLICATION_REMINDER to applicants who currently hold a SAVED
        // application against any job in `matchingJobs`. Recipient computation
        // belongs here so the actual sending is a one-line change later.
    }

    /**
     * Writes a list of jobs into a sub-path of the ZIP, mirroring the same layout
     * used at the root by {@link #exportJobs}. Used by the full admin export so
     * the same builder produces stable, UUID-suffixed folder names suitable for
     * a re-importable archive.
     *
     * @param zos               open ZIP output stream
     * @param basePath          prefix inside the ZIP, ending in {@code "/"} or empty
     * @param jobs              jobs to write
     * @param includeDrafts     whether to include {@code SAVED} applications
     * @param includeUuids      whether to suffix folder names with the entity's short UUID
     * @param includeJsonDumps  whether to write {@code _machine_readable/} JSON files
     */
    void writeJobsInto(
        ZipOutputStream zos,
        String basePath,
        List<Job> jobs,
        boolean includeDrafts,
        boolean includeUuids,
        boolean includeJsonDumps
    ) {
        writeJobsInternal(zos, basePath, jobs, includeDrafts, includeUuids, includeJsonDumps);
    }

    private void writeJobsInternal(
        ZipOutputStream zos,
        String basePath,
        List<Job> jobs,
        boolean includeDrafts,
        boolean includeUuids,
        boolean includeJsonDumps
    ) {
        FolderNameAllocator jobAllocator = new FolderNameAllocator(includeUuids);
        for (Job job : jobs) {
            String folder = basePath + "job_" + jobAllocator.allocate(job.getTitle(), job.getJobId()) + "/";
            try {
                writeJobFolder(zos, folder, job, includeDrafts, includeUuids, includeJsonDumps);
            } catch (StreamAbortedException sae) {
                throw sae;
            } catch (Exception e) {
                // Defensive: one bad job (e.g. corrupt entity, missing relation) must
                // never abort the surrounding ZIP. Drop a placeholder and continue.
                log.error("Failed to write job folder for job {} ({}): {}", job.getJobId(), job.getTitle(), e.getMessage(), e);
                rethrowIfStreamBroken(e);
                writeTextEntry(zos, folder + "_error.txt", "Failed to export job " + job.getJobId() + ": " + e.getMessage());
            }
        }
        if (!jobs.isEmpty()) {
            writeJobsOverviewSheet(zos, basePath + "jobs_overview.xlsx", jobs, includeJsonDumps);
            if (includeJsonDumps) {
                writeJsonEntry(zos, basePath + "_machine_readable/jobs.json", jobs.stream().map(this::toJobDto).toList());
            }
        }
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

    private void writeJobFolder(
        ZipOutputStream zos,
        String folder,
        Job job,
        boolean includeDrafts,
        boolean includeUuids,
        boolean includeJsonDumps
    ) {
        // 1. Job details PDF (reuses existing public job-export PDF)
        try {
            Resource pdf = pdfExportService.exportJobToPDF(job.getJobId(), AdminPdfLabels.forJob());
            zipExportService.addFileToZip(zos, folder + "job_details.pdf", pdf.getInputStream());
        } catch (StreamAbortedException sae) {
            throw sae;
        } catch (Exception e) {
            log.warn("Failed to write job_details.pdf for job {}", job.getJobId(), e);
            rethrowIfStreamBroken(e);
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

        // 3. Per-job overview xlsx + (optionally) machine-readable JSON dumps.
        writeApplicationsOverviewSheet(zos, folder + "applications_overview.xlsx", apps, includeJsonDumps);
        if (includeJsonDumps) {
            writeJsonEntry(zos, folder + "_machine_readable/job.json", toJobDto(job));
            writeJsonEntry(zos, folder + "_machine_readable/applications.json", apps.stream().map(this::toApplicationDto).toList());
        }

        // 4. One folder per application — fresh allocator scoped to this job
        FolderNameAllocator appAllocator = new FolderNameAllocator(includeUuids);
        for (Application app : apps) {
            String label =
                (app.getApplicantLastName() == null ? "applicant" : app.getApplicantLastName()) +
                "_" +
                (app.getApplicantFirstName() == null ? "" : app.getApplicantFirstName());
            String appFolder = folder + "applications/" + appAllocator.allocate(label, app.getApplicationId()) + "/";
            writeApplicationFolder(zos, appFolder, app, job, includeJsonDumps);
        }
    }

    private void writeApplicationFolder(ZipOutputStream zos, String folder, Application app, Job job, boolean includeJsonDumps) {
        // 1. Application details PDF (reuses existing per-applicant PDF)
        try {
            ApplicationDetailDTO dto = ApplicationDetailDTO.getFromEntity(app, job);
            Resource pdf = pdfExportService.exportApplicationToPDF(dto, AdminPdfLabels.forApplication());
            zipExportService.addFileToZip(zos, folder + "application_details.pdf", pdf.getInputStream());
        } catch (StreamAbortedException sae) {
            throw sae;
        } catch (Exception e) {
            // Log full stack trace so future PDF rendering bugs are diagnosable
            // (we previously only had `e.getMessage()` which masked NPEs).
            log.warn("Failed to write application_details.pdf for {}", app.getApplicationId(), e);
            rethrowIfStreamBroken(e);
            writeTextEntry(zos, folder + "application_details.pdf.error.txt", "Failed to render PDF: " + e.getMessage());
        }

        // 2. Machine-readable JSON (review, ratings, comments). Skipped for the
        // human-readable per-type exports — interview data still gets its own
        // PDF in the subfolder below.
        if (includeJsonDumps) {
            writeJsonEntry(zos, folder + "_machine_readable/application.json", toApplicationDto(app));
        }

        // 3. Interview subfolder, only when interview data exists for this application.
        Interviewee interviewee = lookupInterviewee(app);
        if (interviewee != null) {
            if (includeJsonDumps) {
                writeJsonEntry(zos, folder + "interview/interview.json", toIntervieweeDto(interviewee));
            }
            try {
                Resource interviewPdf = pdfExportService.exportInterviewToPDF(interviewee, app, job, AdminPdfLabels.forInterview());
                zipExportService.addFileToZip(zos, folder + "interview/interview_summary.pdf", interviewPdf.getInputStream());
            } catch (StreamAbortedException sae) {
                throw sae;
            } catch (Exception e) {
                log.warn("Failed to write interview_summary.pdf for application {}", app.getApplicationId(), e);
                rethrowIfStreamBroken(e);
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
            // Read the binary FULLY into memory before touching the ZIP stream:
            // a partial write (truncated read, broken pipe, missing file mid-stream)
            // would otherwise leave the deflater between putNextEntry and closeEntry,
            // producing an EBADMSG-corrupt central directory that macOS Archive
            // Utility refuses to open. Buffering keeps the failure isolated to this
            // single document and the catch block writes a placeholder instead.
            try {
                Resource resource = documentService.download(dd.getDocument());
                byte[] bytes;
                try (InputStream is = resource.getInputStream()) {
                    bytes = is.readAllBytes();
                }
                zipExportService.addFileToZip(zos, folder + "documents/" + filename, bytes);
            } catch (StreamAbortedException sae) {
                throw sae;
            } catch (Exception e) {
                log.warn(
                    "Failed to add document {} for application {}: {}",
                    dd.getDocument().getDocumentId(),
                    app.getApplicationId(),
                    e.getMessage()
                );
                rethrowIfStreamBroken(e);
                writeTextEntry(
                    zos,
                    folder + "documents/" + filename + ".error.txt",
                    "Failed to load document " + dd.getDocument().getDocumentId() + ": " + e.getMessage()
                );
            }
        }
    }

    // ----------------------------- overview sheets -----------------------------

    private void writeJobsOverviewSheet(ZipOutputStream zos, String entryPath, List<Job> jobs, boolean includeIds) {
        List<String> headers = new ArrayList<>();
        if (includeIds) {
            headers.add("Job ID");
        }
        headers.addAll(
            List.of(
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
            )
        );
        List<List<Object>> rows = new ArrayList<>(jobs.size());
        for (Job job : jobs) {
            List<Object> row = new ArrayList<>();
            if (includeIds) {
                row.add(nullSafe(job.getJobId()));
            }
            row.add(nullSafe(job.getTitle()));
            row.add(nullSafe(job.getState()));
            row.add(
                job.getSupervisingProfessor() == null
                    ? ""
                    : (
                          nullSafe(job.getSupervisingProfessor().getFirstName()) +
                          " " +
                          nullSafe(job.getSupervisingProfessor().getLastName())
                      ).trim()
            );
            row.add(job.getResearchGroup() == null ? "" : nullSafe(job.getResearchGroup().getName()));
            row.add(job.getSubjectArea() == null ? "" : job.getSubjectArea().name());
            row.add(job.getLocation() == null ? "" : job.getLocation().name());
            row.add(nullSafe(job.getStartDate()));
            row.add(nullSafe(job.getEndDate()));
            row.add(applicationRepository.findAllByJobId(job.getJobId()).size());
            row.add(nullSafe(job.getCreatedAt()));
            rows.add(row);
        }
        xlsxWriter.writeSheet(zos, entryPath, "Jobs", headers, rows);
    }

    private void writeApplicationsOverviewSheet(ZipOutputStream zos, String entryPath, List<Application> apps, boolean includeIds) {
        List<String> headers = new ArrayList<>();
        if (includeIds) {
            headers.add("Application ID");
        }
        headers.addAll(
            List.of(
                "Last Name",
                "First Name",
                "Email",
                "Phone Number",
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
            )
        );
        List<List<Object>> rows = new ArrayList<>(apps.size());
        for (Application app : apps) {
            Set<Rating> ratings = ratingRepository.findByApplicationApplicationId(app.getApplicationId());
            Double avg = ratings.isEmpty()
                ? null
                : ratings
                      .stream()
                      .filter(r -> r.getRating() != null)
                      .mapToInt(Rating::getRating)
                      .average()
                      .orElse(0d);
            Interviewee interviewee = lookupInterviewee(app);
            String interviewRating = interviewee == null || interviewee.getRating() == null ? "" : interviewee.getRating().name();
            InterviewSlot slot = interviewee == null ? null : interviewee.getScheduledSlot();
            Object interviewDate = slot == null ? "" : slot.getStartDateTime();
            String interviewLocation = slot == null ? "" : nullSafeString(slot.getLocation());
            String interviewNotes = interviewee == null ? "" : truncate(nullSafeString(interviewee.getAssessmentNotes()), 500);

            List<Object> row = new ArrayList<>();
            if (includeIds) {
                row.add(nullSafe(app.getApplicationId()));
            }
            row.add(nullSafe(app.getApplicantLastName()));
            row.add(nullSafe(app.getApplicantFirstName()));
            row.add(nullSafe(app.getApplicantEmail()));
            row.add(nullSafe(app.getApplicantPhoneNumber()));
            row.add(nullSafe(app.getState()));
            row.add(avg == null ? "" : avg);
            row.add(interviewRating);
            row.add(interviewDate);
            row.add(interviewLocation);
            row.add(interviewNotes);
            row.add(nullSafe(app.getAppliedAt()));
            row.add(nullSafe(app.getDesiredStartDate()));
            row.add(nullSafe(app.getApplicantBachelorDegreeName()));
            row.add(nullSafe(app.getApplicantBachelorUniversity()));
            row.add(nullSafe(app.getApplicantBachelorGrade()));
            row.add(nullSafe(app.getApplicantMasterDegreeName()));
            row.add(nullSafe(app.getApplicantMasterUniversity()));
            row.add(nullSafe(app.getApplicantMasterGrade()));
            rows.add(row);
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
        List<CustomFieldDTO> customFields =
            job.getCustomFields() == null ? List.of() : job.getCustomFields().stream().map(CustomFieldDTO::getFromEntity).toList();
        return new AdminJobExportDTO(
            JobFormDTO.getFromEntity(job),
            job.getResearchGroup() == null ? null : job.getResearchGroup().getResearchGroupId(),
            customFields,
            job.getCreatedAt(),
            job.getLastModifiedAt()
        );
    }

    AdminApplicationExportDTO toApplicationDto(Application app) {
        ApplicationReviewDTO reviewDto = ApplicationReviewDTO.getFromEntity(app.getApplicationReview());

        List<RatingDetailDTO> ratingDtos = ratingRepository
            .findByApplicationApplicationId(app.getApplicationId())
            .stream()
            .map(RatingDetailDTO::getFromEntity)
            .toList();

        List<InternalCommentDetailDTO> commentDtos =
            app.getInternalComments() == null
                ? List.of()
                : app.getInternalComments().stream().map(InternalCommentDetailDTO::getFromEntity).toList();

        List<CustomFieldAnswerDetailDTO> answerDtos =
            app.getCustomFieldAnswers() == null
                ? List.of()
                : app.getCustomFieldAnswers().stream().map(CustomFieldAnswerDetailDTO::getFromEntity).toList();

        // Mirrors the filename allocation in writeApplicationFolder so the JSON's
        // zipPath matches the actual file on disk inside the ZIP.
        Set<DocumentDictionary> docDicts = app.getDocumentDictionaries() == null ? Set.of() : app.getDocumentDictionaries();
        FolderNameAllocator docPathAllocator = new FolderNameAllocator(false);
        List<DocumentRefDTO> docRefs = docDicts
            .stream()
            .filter(dd -> dd.getDocument() != null)
            .map(dd -> {
                String typeLabel =
                    dd.getDocumentType() == null ? "document" : dd.getDocumentType().name().toLowerCase(java.util.Locale.ROOT);
                String baseName = docPathAllocator.allocate(typeLabel, dd.getDocument().getDocumentId());
                return new DocumentRefDTO(
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
            app.getState(),
            app.getDesiredStartDate(),
            app.getAppliedAt(),
            app.getMotivation(),
            app.getSpecialSkills(),
            app.getProjects(),
            ApplicantDTO.getFromApplicationSnapshot(app),
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

    InterviewDTO toIntervieweeDto(Interviewee interviewee) {
        return InterviewDTO.getFromEntity(interviewee);
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
            // The error placeholder is best-effort: if it can't be written, the
            // stream is almost certainly already broken. Surface that fact so the
            // outer loops abort instead of looping for thousands of failing
            // entries (which is what produced the corrupt ZIP / EBADMSG).
            log.warn("Failed to write text entry {}: {}", entryPath, e.getMessage());
            rethrowIfStreamBroken(e);
        }
    }

    /**
     * Aborts the export immediately when the underlying response/ZIP stream is
     * no longer writable. Symptoms we treat as fatal: Spring's
     * {@code AsyncRequestNotUsableException} (response already committed and
     * closed by the container) and Java's {@code Deflater has been closed} —
     * once those happen, every subsequent write will fail with the same error,
     * so we save the server (and the logs) by stopping right away.
     */
    static void rethrowIfStreamBroken(Throwable e) {
        Throwable cur = e;
        while (cur != null) {
            String msg = cur.getMessage();
            String name = cur.getClass().getName();
            if (
                name.endsWith("AsyncRequestNotUsableException") ||
                (cur instanceof IllegalStateException && msg != null && msg.contains("Deflater has been closed")) ||
                (cur instanceof IOException && msg != null && msg.contains("Stream closed"))
            ) {
                throw new StreamAbortedException("Export stream is no longer writable: " + msg, e);
            }
            cur = cur.getCause();
        }
    }

    /** Sentinel thrown to short-circuit the export when the response stream dies. */
    static final class StreamAbortedException extends RuntimeException {

        StreamAbortedException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private static Object nullSafe(Object value) {
        return value == null ? "" : value;
    }
}
