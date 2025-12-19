package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.domain.Document;
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
     *
     * @param zos      the ZipOutputStream
     * @param filename the name of the file entry in the ZIP
     * @param content  the content of the file
     * @throws IOException if an I/O error occurs
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
     * Adds a file entry to the given ZIP output stream and writes the contents of the provided
     * InputStream into that entry.
     *
     * @param zos the ZipOutputStream to which the entry and data will be written
     * @param filename the name/path of the entry inside the ZIP archive
     * @param inputStream the source InputStream providing the file data; it will be fully consumed but not closed
     * @throws IOException if an I/O error occurs while adding the entry or transferring data
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
     * Adds a document to the ZIP output stream by downloading it via DocumentService.
     *
     * @param zos      the ZipOutputStream
     * @param filename the name of the file entry in the ZIP
     * @param document the document to add
     * @throws IOException if an I/O error occurs
     */
    public void addDocumentToZip(ZipOutputStream zos, String filename, Document document) throws IOException {
        Resource resource = documentService.download(document);
        try (InputStream is = resource.getInputStream()) {
            addFileToZip(zos, filename, is);
        }
    }
}
