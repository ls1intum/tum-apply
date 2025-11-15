package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.constants.School;
import de.tum.cit.aet.core.domain.Image;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends JpaRepository<Image, UUID> {

    /**
     * Find all images by type and default status
     */
    List<Image> findByImageTypeAndIsDefault(ImageType imageType, Boolean isDefault);

    /**
     * Find all images by type, default status, and school
     */
    List<Image> findByImageTypeAndIsDefaultAndSchool(ImageType imageType, Boolean isDefault, School school);

    /**
     * Find default job banners with user information
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.isDefault = :isDefault")
    List<Image> findDefaultImagesWithUploader(@Param("imageType") ImageType imageType, @Param("isDefault") Boolean isDefault);

    /**
     * Find default job banners by school with user information
     */
    @Query(
        "SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.isDefault = :isDefault AND i.school = :school"
    )
    List<Image> findDefaultImagesBySchoolWithUploader(
        @Param("imageType") ImageType imageType,
        @Param("isDefault") Boolean isDefault,
        @Param("school") School school
    );

    /**
     * Find images by uploader
     */
    @Query("SELECT i FROM Image i WHERE i.uploadedBy.userId = :userId AND i.isDefault = false ORDER BY i.createdAt DESC")
    List<Image> findByUploaderId(@Param("userId") UUID userId);

    /**
     * Count images by type and school
     */
    @Query("SELECT COUNT(i) FROM Image i WHERE i.imageType = :imageType AND i.school = :school AND i.isDefault = true")
    long countDefaultImagesBySchool(@Param("imageType") ImageType imageType, @Param("school") School school);

    /**
     * Find all default job banner images for a specific school
     */
    default List<Image> findDefaultJobBannersBySchool(School school) {
        return findByImageTypeAndIsDefaultAndSchool(ImageType.DEFAULT_JOB_BANNER, true, school);
    }

    /**
     * Find all default job banner images (all schools)
     */
    default List<Image> findDefaultJobBanners() {
        return findByImageTypeAndIsDefault(ImageType.DEFAULT_JOB_BANNER, true);
    }
}
