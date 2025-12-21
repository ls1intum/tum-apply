package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.DepartmentImage;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.domain.ProfileImage;
import de.tum.cit.aet.core.domain.ResearchGroupImage;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ImageDTO(
    UUID imageId,
    UUID researchGroupId,
    UUID departmentId,
    String url,
    ImageType imageType,
    Long sizeBytes,
    UUID uploadedById
) {
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
        UUID researchGroupId = null;
        UUID departmentId = null;
        ImageType imageType;

        // Extract the appropriate ID and type based on the image subclass
        if (image instanceof ResearchGroupImage rgi) {
            researchGroupId = rgi.getResearchGroup() != null ? rgi.getResearchGroup().getResearchGroupId() : null;
            imageType = ImageType.JOB_BANNER;
        } else if (image instanceof DepartmentImage di) {
            departmentId = di.getDepartment() != null ? di.getDepartment().getDepartmentId() : null;
            imageType = ImageType.DEFAULT_JOB_BANNER;
        } else if (image instanceof ProfileImage) {
            imageType = ImageType.PROFILE_PICTURE;
        } else {
            throw new IllegalArgumentException("Unknown image type: " + image.getClass().getName());
        }

        return new ImageDTO(
            image.getImageId(),
            researchGroupId,
            departmentId,
            image.getUrl(),
            imageType,
            image.getSizeBytes(),
            uploadedById
        );
    }
}
