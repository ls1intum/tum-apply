package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.dto.exportdata.admin.AdminApplicationExportDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.core.service.ZipExportService;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Produces the {@link de.tum.cit.aet.core.constants.AdminExportType#APPLICATIONS_ONLY}
 * export: a lean safety-net dump of every application with its binary
 * documents, grouped into one folder per applicant.
 *
 * <p>Unlike {@link JobsExportStrategy} this strategy does <em>not</em> walk
 * the job tree — it iterates applications directly, groups them by applicant
 * and flattens the output so the ZIP is easy to hand over to a non-technical
 * recipient who wants "all the applications, organised by person".
 *
 * <p>Contents of the produced ZIP:
 * <pre>
 * applications_only/
 * ├── applications.json                      (flat dump of every application, all UUIDs)
 * └── applications/
 *     └── &lt;firstname&gt;_&lt;lastname&gt;/             (one folder per applicant)
 *         ├── applications.json              (this applicant's applications, all UUIDs)
 *         └── documents/
 *             ├── cv.pdf
 *             ├── bachelor_transcript.pdf
 *             └── …
 * </pre>
 *
 * <p>The top-level {@code applications.json} lists every application in the
 * database (including snapshot fields and all UUID references) so a re-import
 * script can walk the list without having to chase the folder hierarchy.
 * Applications whose applicant row has been deleted — rare, but possible if
 * user retention ran mid-flight — go into {@code applications/_orphans/}
 * instead of a named folder.
 *
 * <p>Documents are looked up via {@link Application#getDocumentDictionaries()}
 * (the same source the per-job export uses) and deduped within each applicant
 * folder by document id, so an applicant with two applications that both
 * reference the same CV only contributes one {@code cv.pdf} to the ZIP.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationsOnlyExportStrategy {

    private final ApplicationRepository applicationRepository;
    private final JobsExportStrategy jobsExportStrategy;
    private final DocumentService documentService;
    private final ZipExportService zipExportService;
    private final ObjectMapper objectMapper;

    /**
     * Writes the applications-only export into the supplied ZIP output stream.
     *
     * @param zos      open ZIP output stream rooted at the export's top-level folder
     * @param manifest export-wide audit trail; applications, applicants (as groups)
     *                 and documents are all recorded against it
     */
    public void exportApplications(ZipOutputStream zos, ExportManifest manifest) {
        List<Application> allApplications = applicationRepository.findAll();
        manifest.expect(ExportManifest.Category.APPLICATION, allApplications.size());

        // 1. Top-level flat dump — every application, every state, with every UUID.
        List<AdminApplicationExportDTO> allDtos = allApplications.stream().map(jobsExportStrategy::toApplicationDto).toList();
        writeJsonEntry(zos, "applications.json", allDtos);

        // 2. Group by applicant id — preserve insertion order for deterministic folder allocation.
        Map<UUID, List<Application>> byApplicant = new LinkedHashMap<>();
        List<Application> orphans = new ArrayList<>();
        for (Application app : allApplications) {
            Applicant applicant = app.getApplicant();
            if (applicant == null || applicant.getUserId() == null) {
                orphans.add(app);
                continue;
            }
            byApplicant.computeIfAbsent(applicant.getUserId(), k -> new ArrayList<>()).add(app);
        }
        manifest.expect(ExportManifest.Category.APPLICANT, byApplicant.size());

        // 3. Per-applicant folders, sorted by last name + first name for stable output.
        List<Map.Entry<UUID, List<Application>>> applicantGroups = new ArrayList<>(byApplicant.entrySet());
        applicantGroups.sort(
            Comparator.comparing(
                (Map.Entry<UUID, List<Application>> entry) -> applicantSortKey(entry.getValue().get(0)),
                Comparator.nullsLast(Comparator.naturalOrder())
            )
        );

        FolderNameAllocator folderAllocator = new FolderNameAllocator(false);
        for (Map.Entry<UUID, List<Application>> entry : applicantGroups) {
            UUID applicantId = entry.getKey();
            List<Application> apps = entry.getValue();
            Application first = apps.get(0);
            String label = applicantFolderLabel(first);
            String folder = "applications/" + folderAllocator.allocate(label, applicantId) + "/";
            try {
                writeApplicantFolder(zos, folder, apps, manifest);
                manifest.exported(ExportManifest.Category.APPLICANT);
            } catch (JobsExportStrategy.StreamAbortedException sae) {
                manifest.failed(ExportManifest.Category.APPLICANT, applicantId, label, sae);
                throw sae;
            } catch (Exception e) {
                log.warn("Failed to write applicant folder for {} ({}): {}", applicantId, label, e.getMessage(), e);
                manifest.failed(ExportManifest.Category.APPLICANT, applicantId, label, e);
                JobsExportStrategy.rethrowIfStreamBroken(e);
            }
        }

        // 4. Orphans — applications with no applicant row. Rare, but still worth
        // capturing so nothing is silently dropped.
        if (!orphans.isEmpty()) {
            try {
                writeApplicantFolder(zos, "applications/_orphans/", orphans, manifest);
            } catch (JobsExportStrategy.StreamAbortedException sae) {
                throw sae;
            } catch (Exception e) {
                log.warn("Failed to write orphan applications folder: {}", e.getMessage(), e);
                JobsExportStrategy.rethrowIfStreamBroken(e);
            }
        }
    }

    /**
     * Writes one applicant's grouped folder: {@code applications.json} with
     * all their application DTOs, plus a {@code documents/} subfolder with
     * the union of every document referenced by any of those applications.
     * Per-applicant document dedup is done by {@code documentId} so a CV
     * referenced by two applications is not written twice.
     */
    private void writeApplicantFolder(ZipOutputStream zos, String folder, List<Application> apps, ExportManifest manifest) {
        // 1. Per-applicant applications.json (full DTOs, all UUIDs).
        List<AdminApplicationExportDTO> dtos = apps.stream().map(jobsExportStrategy::toApplicationDto).toList();
        writeJsonEntry(zos, folder + "applications.json", dtos);

        // 2. Documents. Dedup by document id so the same CV referenced from
        // multiple applications is only written once inside this folder.
        FolderNameAllocator docAllocator = new FolderNameAllocator(false);
        Set<UUID> writtenDocumentIds = new HashSet<>();
        for (Application app : apps) {
            Set<DocumentDictionary> docDicts = app.getDocumentDictionaries() == null ? Set.of() : app.getDocumentDictionaries();
            for (DocumentDictionary dd : docDicts) {
                if (dd.getDocument() == null) {
                    continue;
                }
                if (!writtenDocumentIds.add(dd.getDocument().getDocumentId())) {
                    continue;
                }
                manifest.expect(ExportManifest.Category.DOCUMENT, 1);
                String typeLabel = dd.getDocumentType() == null ? "document" : dd.getDocumentType().name().toLowerCase(Locale.ROOT);
                String baseName = docAllocator.allocate(typeLabel, dd.getDocument().getDocumentId());
                String filename = baseName + AdminExportNaming.extensionForMime(dd.getDocument().getMimeType());
                // Read the binary fully into memory before writing into the ZIP —
                // a partial write (truncated stream, missing blob mid-flight) would
                // otherwise corrupt the surrounding ZIP. Buffering isolates the
                // failure to this one document and the catch block writes an
                // error placeholder instead.
                try {
                    Resource resource = documentService.download(dd.getDocument());
                    byte[] bytes;
                    try (InputStream is = resource.getInputStream()) {
                        bytes = is.readAllBytes();
                    }
                    zipExportService.addFileToZip(zos, folder + "documents/" + filename, bytes);
                    manifest.exported(ExportManifest.Category.DOCUMENT);
                } catch (JobsExportStrategy.StreamAbortedException sae) {
                    manifest.failed(ExportManifest.Category.DOCUMENT, dd.getDocument().getDocumentId(), filename, sae);
                    throw sae;
                } catch (Exception e) {
                    log.warn(
                        "Failed to add document {} for application {}: {}",
                        dd.getDocument().getDocumentId(),
                        app.getApplicationId(),
                        e.getMessage()
                    );
                    manifest.failed(ExportManifest.Category.DOCUMENT, dd.getDocument().getDocumentId(), filename, e);
                    JobsExportStrategy.rethrowIfStreamBroken(e);
                    writeTextEntry(
                        zos,
                        folder + "documents/" + filename + ".error.txt",
                        "Failed to load document " + dd.getDocument().getDocumentId() + ": " + e.getMessage()
                    );
                }
            }
        }

        // 3. Finally record the applications themselves as exported — we do
        // this after the documents so a mid-flight failure in the documents
        // loop leaves the application count in a truthful state.
        for (Application ignored : apps) {
            manifest.exported(ExportManifest.Category.APPLICATION);
        }
    }

    /**
     * Builds the folder label for an applicant from the first application's
     * snapshot name fields. Snapshot fields are populated at application
     * creation time so they are always present on a persisted application,
     * whereas {@code Applicant.user} can be lazily loaded and may come back
     * stale.
     */
    private String applicantFolderLabel(Application first) {
        String firstName = first.getApplicantFirstName() == null ? "" : first.getApplicantFirstName();
        String lastName = first.getApplicantLastName() == null ? "" : first.getApplicantLastName();
        String combined = (firstName + "_" + lastName).trim();
        return combined.isEmpty() || combined.equals("_") ? "applicant" : combined;
    }

    /** Sort key for applicant groups: {@code "<last>, <first>"} so output ordering is stable. */
    private String applicantSortKey(Application first) {
        String last = first.getApplicantLastName() == null ? "" : first.getApplicantLastName();
        String firstName = first.getApplicantFirstName() == null ? "" : first.getApplicantFirstName();
        return last + ", " + firstName;
    }

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
            // Best-effort error placeholder: if even this fails, the stream is
            // almost certainly already broken — surface that so the outer loop
            // can abort instead of flailing for every subsequent entry.
            log.warn("Failed to write text entry {}: {}", entryPath, e.getMessage());
            JobsExportStrategy.rethrowIfStreamBroken(e);
        }
    }
}
