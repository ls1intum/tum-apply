package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends TumApplyJpaRepository<Image, UUID> {
    /**
     * Find all images by type and research group
     *
     * @param imageType      the type of images to find
     * @param researchGroupId the research group ID to filter by
     * @return a list of images matching the criteria
     */
    @Query("SELECT i FROM Image i WHERE i.imageType = :imageType AND i.researchGroup.researchGroupId = :researchGroupId")
    List<Image> findByImageTypeAndResearchGroup(@Param("imageType") ImageType imageType, @Param("researchGroupId") UUID researchGroupId);

    /**
     * Find default job banners with user information
     *
     * @param imageType the type of images to find
     * @return a list of images with uploader information
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType")
    List<Image> findImagesWithUploader(@Param("imageType") ImageType imageType);

    /**
     * Find default job banners by research group with user information
     *
     * @param imageType       the type of images to find
     * @param researchGroupId the research group ID to filter by
     * @return a list of images with uploader information
     */
    @Query(
        "SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.researchGroup.researchGroupId = :researchGroupId"
    )
    List<Image> findImagesByResearchGroupWithUploader(
        @Param("imageType") ImageType imageType,
        @Param("researchGroupId") UUID researchGroupId
    );

    /**
     * Find images by uploader (non-default images only)
     *
     * @param userId the ID of the user who uploaded the images
     * @return a list of images uploaded by the user (excludes default images)
     */
    @Query("SELECT i FROM Image i WHERE i.uploadedBy.userId = :userId AND i.imageType != 'DEFAULT_JOB_BANNER' ORDER BY i.createdAt DESC")
    List<Image> findByUploaderId(@Param("userId") UUID userId);

    /**
     * Count default images by research group
     *
     * @param imageType       the type of images to count (should be DEFAULT_JOB_BANNER)
     * @param researchGroupId the research group ID to filter by
     * @return the count of matching images
     */
    @Query("SELECT COUNT(i) FROM Image i WHERE i.imageType = :imageType AND i.researchGroup.researchGroupId = :researchGroupId")
    long countDefaultImagesByResearchGroup(@Param("imageType") ImageType imageType, @Param("researchGroupId") UUID researchGroupId);

    /**
     * Find all default job banner images for a specific school
     *
     * @param school the school to find banners for (e.g., "CIT", "CS")
     * @return a list of default job banners for the school
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.researchGroup.school = :school")
    List<Image> findDefaultJobBannersBySchool(@Param("imageType") ImageType imageType, @Param("school") String school);

    /**
     * Find all default job banner images for a specific research group
     *
     * @param researchGroupId the research group ID to find banners for
     * @return a list of default job banners for the research group
     */
    default List<Image> findDefaultJobBannersByResearchGroup(UUID researchGroupId) {
        return findByImageTypeAndResearchGroup(ImageType.DEFAULT_JOB_BANNER, researchGroupId);
    }

    /**
     * Find all default job banner images (all schools)
     *
     * @return a list of all default job banners
     */
    default List<Image> findDefaultJobBanners() {
        return findImagesWithUploader(ImageType.DEFAULT_JOB_BANNER);
    }

    /**
     * Convenience method to find default job banners by school
     *
     * @param school the school to find banners for (e.g., "CIT", "CS")
     * @return a list of default job banners for the school
     */
    default List<Image> findDefaultJobBannersBySchool(String school) {
        return findDefaultJobBannersBySchool(ImageType.DEFAULT_JOB_BANNER, school);
    }
}
