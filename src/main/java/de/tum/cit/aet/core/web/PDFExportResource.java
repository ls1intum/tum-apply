package de.tum.cit.aet.core.web;

import de.tum.cit.aet.application.domain.dto.ApplicationPDFRequest;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.core.service.PDFExportService;
import de.tum.cit.aet.job.dto.JobPreviewRequest;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for exporting job and application details as PDF
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/export")
public class PDFExportResource {

    private final PDFExportService pdfExportService;

    /**
     * POST /api/export/application/pdf : Export application details as PDF
     *
     * @param request the ApplicationPDFRequest containing application data and
     *                labels
     * @return the PDF file as downloadable attachment
     */
    @Authenticated
    @PostMapping(value = "/application/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> exportApplicationToPDF(@RequestBody ApplicationPDFRequest request) {
        log.info("POST /api/export/application/pdf");
        Resource pdf = pdfExportService.exportApplicationToPDF(request.application(), request.labels());
        String filename = pdfExportService.generateApplicationFilename(
            request.application().jobTitle(),
            request.labels().get("application")
        );

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
        log.info("POST /api/export/job/{}/pdf", id);
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
        log.info("POST /api/export/job/preview/pdf");
        Resource pdf = pdfExportService.exportJobPreviewToPDF(request.job(), request.labels());
        String filename = pdfExportService.generateJobFilenameForPreview(request.job(), request.labels().get("jobPdfEnding"));

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }
}
