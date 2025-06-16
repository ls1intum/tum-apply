package de.tum.cit.aet.application.web;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class MultipartUploadRequest {

    @Schema(type = "array", format = "binary", description = "List of documents to upload")
    private List<MultipartFile> files;
}
