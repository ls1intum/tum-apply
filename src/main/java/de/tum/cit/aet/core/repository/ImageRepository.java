package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.constants.School;
import de.tum.cit.aet.core.domain.Image;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends TumApplyJpaRepository<Image, UUID> {
    /**
     * Find all images by type and school
     *
     * @param imageType the type of images to find
     * @param school    the school to filter by
     * @return a list of images matching the criteria
     */
    List<Image> findByImageTypeAndSchool(ImageType imageType, School school);

    /**
     * Find default job banners with user information
     *
     * @param imageType the type of images to find
     * @return a list of images with uploader information
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType")
    List<Image> findImagesWithUploader(@Param("imageType") ImageType imageType);

    /**
     * Find default job banners by school with user information
     *
     * @param imageType the type of images to find
     * @param school    the school to filter by
     * @return a list of images with uploader information
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.school = :school")
    List<Image> findImagesBySchoolWithUploader(@Param("imageType") ImageType imageType, @Param("school") School school);

    /**
     * Find images by uploader (non-default images only)
     *
     * @param userId the ID of the user who uploaded the images
     * @return a list of images uploaded by the user (excludes default images)
     */
    @Query("SELECT i FROM Image i WHERE i.uploadedBy.userId = :userId AND i.imageType != 'DEFAULT_JOB_BANNER' ORDER BY i.createdAt DESC")
    List<Image> findByUploaderId(@Param("userId") UUID userId);

    /**
     * Count default images by school
     *
     * @param imageType the type of images to count (should be DEFAULT_JOB_BANNER)
     * @param school    the school to filter by
     * @return the count of matching images
     */
    @Query("SELECT COUNT(i) FROM Image i WHERE i.imageType = :imageType AND i.school = :school")
    long countDefaultImagesBySchool(@Param("imageType") ImageType imageType, @Param("school") School school);

    /**
     * Find all default job banner images for a specific school
     *
     * @param school the school to find banners for
     * @return a list of default job banners for the school
     */
    default List<Image> findDefaultJobBannersBySchool(School school) {
        return findByImageTypeAndSchool(ImageType.DEFAULT_JOB_BANNER, school);
    }

    /**
     * Find all default job banner images (all schools)
     *
     * @return a list of all default job banners
     */
    default List<Image> findDefaultJobBanners() {
        return findImagesWithUploader(ImageType.DEFAULT_JOB_BANNER);
    }
}
