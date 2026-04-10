package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.service.ZipExportService;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.Deflater;
import java.util.zip.ZipOutputStream;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Orchestrates admin bulk exports: opens a {@link ZipOutputStream} on the supplied
 * {@link OutputStream} (typically the HTTP response stream), dispatches to the
 * right strategy based on {@link AdminExportType}, and writes a localized README
 * so the recipient knows how to navigate the archive.
 *
 * <p>Streams the ZIP directly to the caller — no temp files on disk.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminExportZipWriter {

    private static final String README_DE = "README_ADMIN_EXPORT_DE.txt";
    private static final String README_EN = "README_ADMIN_EXPORT_EN.txt";

    private final ZipExportService zipExportService;
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

            writeReadme(zos, type);

            switch (type) {
                case JOBS_OPEN, JOBS_EXPIRED, JOBS_CLOSED -> jobsExportStrategy.exportJobs(zos, type);
                case FULL_ADMIN -> fullAdminExportStrategy.exportFull(zos);
            }

            zos.finish();
        } catch (IOException e) {
            throw new UserDataExportException("Failed to write admin export ZIP for " + type, e);
        }
    }

    private void writeReadme(ZipOutputStream zos, AdminExportType type) {
        try {
            zipExportService.addFileToZip(zos, README_EN, buildEnglishReadme(type).getBytes(StandardCharsets.UTF_8));
            zipExportService.addFileToZip(zos, README_DE, buildGermanReadme(type).getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            log.warn("Failed to write README for admin export {}: {}", type, e.getMessage());
        }
    }

    private String buildEnglishReadme(AdminExportType type) {
        String typeDescription =
            switch (type) {
                case JOBS_OPEN -> "all currently published jobs whose application deadline has not yet passed";
                case JOBS_EXPIRED -> "all published jobs whose application deadline has already passed";
                case JOBS_CLOSED -> "all jobs that are closed or where an applicant has been selected";
                case FULL_ADMIN -> "the entire system: research groups with members, every job (including drafts) grouped under its research group, every application, and re-importable JSON dumps";
            };
        return """
        TUMApply – Admin Bulk Export
        ============================

        This archive contains %s.

        Folder layout
        -------------
        Two complementary representations sit side-by-side:

        1. Human-readable
           * Each entity has its own subfolder.
           * Job folders contain `job_details.pdf`, an `applications_overview.xlsx`
             with one row per applicant (sortable in Excel/Numbers/LibreOffice),
             and one subfolder per applicant with their CV/transcripts and a
             `application_details.pdf`.
           * Research group folders contain a `members_overview.xlsx`.

        2. Machine-readable (`_machine_readable/` subfolders)
           * Plain JSON dumps of every entity in the same scope, with foreign
             keys stored as ids so the data could be re-imported into a
             database. The applicant document files referenced from the JSON
             live next to the JSON in the corresponding `documents/` folder.

        Notes
        -----
        * `applicant_*` fields on each application are SNAPSHOTS captured at
          submission time. They reflect the applicant as they were when the
          application was sent, even if the underlying user record has changed
          since.
        * For the "Open Jobs" export, draft applications (state SAVED) are
          intentionally excluded.
        """.formatted(typeDescription);
    }

    private String buildGermanReadme(AdminExportType type) {
        String typeBeschreibung =
            switch (type) {
                case JOBS_OPEN -> "alle aktuell veroeffentlichten Stellen, deren Bewerbungsfrist noch nicht abgelaufen ist";
                case JOBS_EXPIRED -> "alle veroeffentlichten Stellen, deren Bewerbungsfrist bereits abgelaufen ist";
                case JOBS_CLOSED -> "alle geschlossenen Stellen oder Stellen, fuer die ein Bewerber gefunden wurde";
                case FULL_ADMIN -> "das gesamte System: Forschungsgruppen mit Mitgliedern, jede Stelle (auch Entwuerfe) unter ihrer Forschungsgruppe, jede Bewerbung sowie re-importierbare JSON-Dumps";
            };
        return """
        TUMApply – Admin-Massenexport
        =============================

        Dieses Archiv enthaelt %s.

        Ordnerstruktur
        --------------
        Zwei sich ergaenzende Darstellungen liegen nebeneinander:

        1. Menschlich lesbar
           * Jede Entitaet hat einen eigenen Unterordner.
           * Stellenordner enthalten `job_details.pdf`, eine
             `applications_overview.xlsx` (in Excel/Numbers/LibreOffice
             sortierbar) mit einer Zeile pro Bewerber, und je einen Unterordner
             pro Bewerber mit Lebenslauf/Zeugnissen sowie einer
             `application_details.pdf`.
           * Forschungsgruppen-Ordner enthalten eine `members_overview.xlsx`.

        2. Maschinell lesbar (`_machine_readable/`-Unterordner)
           * JSON-Dumps aller Entitaeten im gleichen Geltungsbereich, mit
             Fremdschluesseln als IDs, sodass die Daten wieder in eine
             Datenbank importiert werden koennen. Die in den JSON-Dateien
             referenzierten Bewerbungsdokumente liegen jeweils im
             zugehoerigen `documents/`-Unterordner neben der JSON.

        Hinweise
        --------
        * Die `applicant_*`-Felder einer Bewerbung sind SNAPSHOTS aus dem
          Moment der Einreichung. Sie spiegeln den Bewerber zum
          Bewerbungszeitpunkt wider, auch wenn sich der zugehoerige
          Nutzerdatensatz seitdem geaendert hat.
        * Fuer den Export "Offene Stellen" werden Entwuerfe (Status SAVED)
          bewusst weggelassen.
        """.formatted(typeBeschreibung);
    }
}
