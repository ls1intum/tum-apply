package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.ZipExportService;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.UUID;
import java.util.zip.Deflater;
import java.util.zip.ZipOutputStream;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Orchestrates admin bulk exports: opens a {@link ZipOutputStream} on the supplied
 * {@link OutputStream} (typically the HTTP response stream) and dispatches to the
 * right strategy based on {@link AdminExportType}.
 *
 * <p>Streams the ZIP directly to the caller — no temp files on disk. Every export
 * carries an {@link ExportManifest} which is rendered to {@code manifest.json} at
 * the ZIP root so recipients can verify completeness without trusting the server
 * log.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminExportZipWriter {

    private final JobsExportStrategy jobsExportStrategy;
    private final FullAdminExportStrategy fullAdminExportStrategy;
    private final ZipExportService zipExportService;
    private final ObjectMapper objectMapper;

    /**
     * Streams a fully built admin export ZIP into the supplied output stream.
     * The caller owns the stream's lifecycle (it is buffered internally but not
     * closed by this method, so the caller may continue writing trailers if any).
     *
     * @param out         destination stream to write the ZIP into
     * @param type        which kind of admin export to produce
     * @param requestedBy id of the admin user who initiated this export
     */
    public void writeExport(@NonNull OutputStream out, @NonNull AdminExportType type, @NonNull UUID requestedBy) {
        ExportManifest manifest = new ExportManifest(type, requestedBy);
        try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(out))) {
            zos.setLevel(Deflater.BEST_COMPRESSION);

            try {
                switch (type) {
                    case JOBS_OPEN, JOBS_EXPIRED, JOBS_CLOSED -> jobsExportStrategy.exportJobs(zos, type, manifest);
                    case FULL_ADMIN -> fullAdminExportStrategy.exportFull(zos, manifest);
                }
            } catch (JobsExportStrategy.StreamAbortedException sae) {
                // Stream is gone — manifest write below will likely also fail,
                // but try anyway so the recipient sees status=ABORTED if any
                // bytes do make it through.
                log.error("Admin export {} aborted: {}", type, sae.getMessage());
                manifest.aborted(sae.getMessage());
            }

            // Always attempt to write the manifest, even on partial / aborted runs.
            writeManifest(zos, manifest);
            logSummary(type, manifest);

            zos.finish();
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write admin export ZIP for " + type, e);
        }
    }

    private void writeManifest(ZipOutputStream zos, ExportManifest manifest) {
        try {
            ExportManifest.Payload payload = manifest.finish();
            byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            zipExportService.addFileToZip(zos, "manifest.json", bytes);
        } catch (Exception e) {
            // Last-ditch — if manifest itself can't be written the ZIP is already
            // dead. Log and let the outer try/catch propagate.
            log.error("Failed to write manifest.json (export will not be verifiable)", e);
        }
    }

    private void logSummary(AdminExportType type, ExportManifest manifest) {
        ExportManifest.Payload p = manifest.finish();
        log.info(
            "Admin export {} finished with status {} in {}s — RG {}/{} (failed {}), Jobs {}/{} (failed {}), " +
            "Applications {}/{} (failed {}), Documents {}/{} (failed {}), Users {}/{} (failed {}), total failures: {}",
            type,
            p.status(),
            p.durationSeconds(),
            p.totals().researchGroups().exported(),
            p.totals().researchGroups().expected(),
            p.totals().researchGroups().failed(),
            p.totals().jobs().exported(),
            p.totals().jobs().expected(),
            p.totals().jobs().failed(),
            p.totals().applications().exported(),
            p.totals().applications().expected(),
            p.totals().applications().failed(),
            p.totals().documents().exported(),
            p.totals().documents().expected(),
            p.totals().documents().failed(),
            p.totals().users().exported(),
            p.totals().users().expected(),
            p.totals().users().failed(),
            p.failures().size()
        );
    }
}
