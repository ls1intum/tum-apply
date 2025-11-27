package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.core.service.PDFExportService;
import de.tum.cit.aet.job.dto.JobPreviewRequest;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for exporting job and application details as PDF
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/export")
public class PDFExportResource {

    private final PDFExportService pdfExportService;

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
        String filename = pdfExportService.generateJobFilename(id, labels.get("jobPdfEnding"));

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    /**
     * POST /api/export/job/preview/pdf : Export job details in the preview view as
     * PDF
     *
     * @param request the JobPreviewRequest containing job data and labels
     * @return the PDF file as downloadable attachment
     */
    @ProfessorOrEmployee
    @PostMapping(value = "/job/preview/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> exportJobPreviewToPDF(@RequestBody JobPreviewRequest request) {
        Resource pdf = pdfExportService.exportJobPreviewToPDF(request.job(), request.labels());
        String filename = pdfExportService.generateJobFilenameForPreview(request.job(), request.labels().get("jobPdfEnding"));

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }
}
