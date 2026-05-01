package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.documents.domain.Document;
import de.tum.cit.aet.core.documents.service.DocumentService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ZipExportService {

    @Value("${aet.download.deterministic-zip:false}")
    private boolean deterministicZip;

    private final DocumentService documentService;

    /**
     * Initializes the HTTP response for a ZIP file download.
     *
     * @param response the HttpServletResponse to configure
     * @param filename the filename for the ZIP file (without .zip extension)
     */
    public void initZipResponse(HttpServletResponse response, String filename) {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", String.format("attachment; filename=\"%s.zip\"", filename));
    }

    /**
     * Adds a file to the ZIP output stream.
     */
    public void addFileToZip(ZipOutputStream zos, String filename, byte[] content) throws IOException {
        ZipEntry entry = new ZipEntry(filename);
        if (deterministicZip) {
            entry.setTime(0L);
        }
        zos.putNextEntry(entry);
        zos.write(content);
        zos.closeEntry();
    }

    /**
     * Adds a file entry by streaming an InputStream into the archive.
     */
    public void addFileToZip(ZipOutputStream zos, String filename, InputStream inputStream) throws IOException {
        ZipEntry entry = new ZipEntry(filename);
        if (deterministicZip) {
            entry.setTime(0L);
        }
        zos.putNextEntry(entry);
        inputStream.transferTo(zos);
        zos.closeEntry();
    }

    /**
     * Adds a document to the ZIP output stream by loading it through DocumentService.
     */
    public void addDocumentToZip(ZipOutputStream zos, String filename, Document document) throws IOException {
        Resource resource = documentService.loadResourceForExport(document);
        try (InputStream is = resource.getInputStream()) {
            addFileToZip(zos, filename, is);
        }
    }
}
