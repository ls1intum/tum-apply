package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.export.admin.AdminExportZipWriter;
import java.io.OutputStream;
import java.util.Objects;
import java.util.UUID;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Synchronous admin bulk export service. Builds the ZIP for the requested type
 * directly into the supplied output stream so the controller can stream it
 * straight back to the browser as a download — no DB tracking, no email,
 * no token, no temp files on disk.
 *
 * <p>Wraps the build in a read-only transaction so the strategies can lazily
 * load entity collections (jobs → applications → documents …) without hitting
 * detached-entity issues.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDataExportService {

    private final AdminExportZipWriter adminExportZipWriter;
    private final PlatformTransactionManager transactionManager;

    /**
     * Builds an admin export ZIP of the requested type and streams it into the
     * provided output stream. The transaction stays open for the entire build
     * so lazy collections inside the strategies remain accessible.
     *
     * @param type        which kind of admin export to produce
     * @param out         destination output stream (typically the HTTP response)
     * @param requestedBy id of the admin user who initiated this export — recorded
     *                    in the manifest at the root of the produced ZIP
     */
    public void buildExport(@NonNull AdminExportType type, @NonNull OutputStream out, @NonNull UUID requestedBy) {
        TransactionTemplate tx = new TransactionTemplate(Objects.requireNonNull(transactionManager));
        tx.setReadOnly(true);
        try {
            tx.executeWithoutResult(status -> adminExportZipWriter.writeExport(out, type, requestedBy));
        } catch (RuntimeException e) {
            log.error("Failed to build admin export of type {}", type, e);
            throw new UserDataExportException("Failed to build admin export: " + e.getMessage(), e);
        }
    }

    /**
     * Returns a stable, human-friendly file name for the produced ZIP based on
     * the export type and the current date. Used by the controller for the
     * {@code Content-Disposition} header.
     *
     * @param type which kind of admin export to produce
     * @return a sanitized base file name including the {@code .zip} extension
     */
    public String fileNameFor(@NonNull AdminExportType type) {
        String today = java.time.LocalDate.now().toString();
        return "admin-export-" + type.name().toLowerCase() + "-" + today + ".zip";
    }
}
