package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.ZipExportService;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.zip.Deflater;
import java.util.zip.ZipOutputStream;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Orchestrates admin bulk exports: opens a {@link ZipOutputStream} on the supplied
 * {@link OutputStream} (typically a {@code FileOutputStream} pointing at the task's
 * temp file) and dispatches to the right strategy based on {@link AdminExportType}.
 *
 * <p>The {@link ExportManifest} is owned by the calling task — counts and failures
 * recorded by the strategies flow back into the same instance the task exposes via
 * its polling endpoint, so progress is visible live without finalizing the manifest.
 * The same manifest is rendered to {@code manifest.json} at the ZIP root once the
 * build is finished.
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
     * The caller owns both the stream's lifecycle and the manifest — they can
     * call {@link ExportManifest#snapshot()} on the manifest at any time during
     * the build to read live progress.
     *
     * @param out      destination stream to write the ZIP into
     * @param type     which kind of admin export to produce
     * @param manifest export-wide audit trail; must already be constructed by the caller
     */
    public void writeExport(@NonNull OutputStream out, @NonNull AdminExportType type, @NonNull ExportManifest manifest) {
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
}
