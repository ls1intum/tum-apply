package de.tum.cit.aet.core.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FileExtension {
    PDF("pdf");

    //    PNG("png"),
    //    JPEG("jpeg"),
    //    JPG("jpg"),
    //    GIF("gif"),
    //    WEBP("webp");

    private String extension;
}
