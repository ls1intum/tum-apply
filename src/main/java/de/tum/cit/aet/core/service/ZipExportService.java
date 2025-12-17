package de.tum.cit.aet.core.service;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ZipExportService {

    @Value("${aet.download.deterministic-zip:false}")
    private boolean deterministicZip;

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
}
