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
     * Find all images by type and default status
     *
     * @param imageType the type of images to find
     * @param isDefault whether to find default images
     * @return a list of images matching the criteria
     */
    List<Image> findByImageTypeAndIsDefault(ImageType imageType, Boolean isDefault);

    /**
     * Find all images by type, default status, and school
     *
     * @param imageType the type of images to find
     * @param isDefault whether to find default images
     * @param school    the school to filter by
     * @return a list of images matching the criteria
     */
    List<Image> findByImageTypeAndIsDefaultAndSchool(ImageType imageType, Boolean isDefault, School school);

    /**
     * Find default job banners with user information
     *
     * @param imageType the type of images to find
     * @param isDefault whether to find default images
     * @return a list of images with uploader information
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.isDefault = :isDefault")
    List<Image> findDefaultImagesWithUploader(@Param("imageType") ImageType imageType,
            @Param("isDefault") Boolean isDefault);

    /**
     * Find default job banners by school with user information
     *
     * @param imageType the type of images to find
     * @param isDefault whether to find default images
     * @param school    the school to filter by
     * @return a list of images with uploader information
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.isDefault = :isDefault AND i.school = :school")
    List<Image> findDefaultImagesBySchoolWithUploader(
            @Param("imageType") ImageType imageType,
            @Param("isDefault") Boolean isDefault,
            @Param("school") School school);

    /**
     * Find images by uploader
     *
     * @param userId the ID of the user who uploaded the images
     * @return a list of images uploaded by the user
     */
    @Query("SELECT i FROM Image i WHERE i.uploadedBy.userId = :userId AND i.isDefault = false ORDER BY i.createdAt DESC")
    List<Image> findByUploaderId(@Param("userId") UUID userId);

    /**
     * Count images by type and school
     *
     * @param imageType the type of images to count
     * @param school    the school to filter by
     * @return the count of matching images
     */
    @Query("SELECT COUNT(i) FROM Image i WHERE i.imageType = :imageType AND i.school = :school AND i.isDefault = true")
    long countDefaultImagesBySchool(@Param("imageType") ImageType imageType, @Param("school") School school);

    /**
     * Find all default job banner images for a specific school
     *
     * @param school the school to find banners for
     * @return a list of default job banners for the school
     */
    default List<Image> findDefaultJobBannersBySchool(School school) {
        return findByImageTypeAndIsDefaultAndSchool(ImageType.DEFAULT_JOB_BANNER, true, school);
    }

    /**
     * Find all default job banner images (all schools)
     *
     * @return a list of all default job banners
     */
    default List<Image> findDefaultJobBanners() {
        return findByImageTypeAndIsDefault(ImageType.DEFAULT_JOB_BANNER, true);
    }
}
