package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.core.service.PDFExportService;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for exporting job and application details as PDF
 */
@RestController
@RequestMapping("/api/export")
public class PDFExportResource {

    private final PDFExportService pdfExportService;

    public PDFExportResource(PDFExportService pdfExportService) {
        this.pdfExportService = pdfExportService;
    }

    /**
     * POST /api/export/application/{id}/pdf : Export application details as PDF
     *
     * @param id     the application ID
     * @param labels translation labels for PDF content
     * @return the PDF file as downloadable attachment
     */
    @PostMapping(value = "/application/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Authenticated
    public ResponseEntity<Resource> exportApplicationToPDF(@PathVariable UUID id, @RequestBody Map<String, String> labels) {
        Resource pdf = pdfExportService.exportApplicationToPDF(id, labels);
        String filename = pdfExportService.generateApplicationFilename(id, labels.get("application"));

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    /**
     * POST /api/export/job/{id}/pdf : Export job details as PDF
     *
     * @param id     the job ID
     * @param labels translation labels for PDF content
     * @return the PDF file as downloadable attachment
     */
    @Public
    @PostMapping(value = "/job/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> exportJobToPDF(@PathVariable UUID id, @RequestBody Map<String, String> labels) {
        Resource pdf = pdfExportService.exportJobToPDF(id, labels);
        String filename = pdfExportService.generateJobFilename(id, "jobPlaceHolder");

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }
}
