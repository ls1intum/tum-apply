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
     * Find all images by type and specific research group ID
     * Results are ordered by creation date (oldest first)
     *
     * @param imageType      the type of images to find
     * @param researchGroupId the specific research group ID to filter by
     * @return a list of images belonging to that specific research group, ordered by creation date ascending
     */
    @Query(
        "SELECT i FROM Image i JOIN i.researchGroup rg WHERE i.imageType = :imageType AND rg.researchGroupId = :researchGroupId ORDER BY i.createdAt ASC"
    )
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
     * Find images by uploader (non-default images only)
     *
     * @param userId the ID of the user who uploaded the images
     * @return a list of images uploaded by the user (excludes default images)
     */
    @Query("SELECT i FROM Image i WHERE i.uploadedBy.userId = :userId AND i.imageType != 'DEFAULT_JOB_BANNER' ORDER BY i.createdAt DESC")
    List<Image> findByUploaderId(@Param("userId") UUID userId);

    /**
     * Find all default job banner images for a specific school
     *
     * @param imageType the type of images to find (typically DEFAULT_JOB_BANNER)
     * @param schoolId the school ID to find banners for
     * @return a list of default job banners for the school
     */
    @Query(
        "SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy JOIN i.researchGroup rg JOIN rg.department dept WHERE i.imageType = :imageType AND dept.school.schoolId = :schoolId"
    )
    List<Image> findByImageTypeAndSchoolId(@Param("imageType") ImageType imageType, @Param("schoolId") UUID schoolId);

    /**
     * Find all default job banner images across all schools
     *
     * @return a list of all default job banners from all schools
     */
    default List<Image> findDefaultJobBanners() {
        return findImagesWithUploader(ImageType.DEFAULT_JOB_BANNER);
    }

    /**
     * Convenience method to find default job banners by school ID
     *
     * @param schoolId the school ID to find banners for
     * @return a list of default job banners for the school
     */
    default List<Image> findDefaultJobBannersBySchool(UUID schoolId) {
        return findByImageTypeAndSchoolId(ImageType.DEFAULT_JOB_BANNER, schoolId);
    }
}
