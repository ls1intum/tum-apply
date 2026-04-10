package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.exception.UserDataExportException;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.zip.Deflater;
import java.util.zip.ZipOutputStream;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Orchestrates admin bulk exports: opens a {@link ZipOutputStream} on the supplied
 * {@link OutputStream} (typically the HTTP response stream) and dispatches to the
 * right strategy based on {@link AdminExportType}.
 *
 * <p>Streams the ZIP directly to the caller — no temp files on disk.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminExportZipWriter {

    private final JobsExportStrategy jobsExportStrategy;
    private final FullAdminExportStrategy fullAdminExportStrategy;

    /**
     * Streams a fully built admin export ZIP into the supplied output stream.
     * The caller owns the stream's lifecycle (it is buffered internally but not
     * closed by this method, so the caller may continue writing trailers if any).
     *
     * @param out  destination stream to write the ZIP into
     * @param type which kind of admin export to produce
     */
    public void writeExport(@NonNull OutputStream out, @NonNull AdminExportType type) {
        try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(out))) {
            zos.setLevel(Deflater.BEST_COMPRESSION);

            switch (type) {
                case JOBS_OPEN, JOBS_EXPIRED, JOBS_CLOSED -> jobsExportStrategy.exportJobs(zos, type);
                case FULL_ADMIN -> fullAdminExportStrategy.exportFull(zos);
            }

            zos.finish();
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write admin export ZIP for " + type, e);
        }
    }
}
