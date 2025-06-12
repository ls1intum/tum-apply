package de.tum.cit.aet.application.web;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public class MultipartUploadRequest {

    @Schema(type = "array", format = "binary", description = "List of documents to upload")
    private List<MultipartFile> files;

    public List<MultipartFile> getFiles() {
        return files;
    }

    public void setFiles(List<MultipartFile> files) {
        this.files = files;
    }
}
