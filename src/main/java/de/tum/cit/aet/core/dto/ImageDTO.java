package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ImageDTO(UUID imageId, UUID researchGroupId, String url, ImageType imageType, Long sizeBytes, UUID uploadedById) {
    /**
     * Convert an Image entity to an ImageDTO
     *
     * @param image the Image entity to convert
     * @return the ImageDTO representation
     */
    public static ImageDTO fromEntity(Image image) {
        if (image == null) {
            return null;
        }

        UUID uploadedById = image.getUploadedBy() != null ? image.getUploadedBy().getUserId() : null;

        return new ImageDTO(
            image.getImageId(),
            image.getResearchGroup() != null ? image.getResearchGroup().getResearchGroupId() : null,
            image.getUrl(),
            image.getImageType(),
            image.getSizeBytes(),
            uploadedById
        );
    }
}
