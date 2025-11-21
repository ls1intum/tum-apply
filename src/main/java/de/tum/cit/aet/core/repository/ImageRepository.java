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
     * Find default images by school (determined from a research group) with user information
     *
     * @param imageType       the type of images to find (typically DEFAULT_JOB_BANNER)
     * @param researchGroupId the research group ID (used to determine the school)
     * @return a list of default images for that school with uploader information eagerly loaded
     */
    @Query(
        "SELECT i FROM Image i " +
            "LEFT JOIN FETCH i.uploadedBy " +
            "JOIN i.researchGroup irg " +
            "JOIN ResearchGroup rg ON rg.researchGroupId = :researchGroupId " +
            "WHERE i.imageType = :imageType AND irg.school = rg.school"
    )
    List<Image> findDefaultImagesBySchoolViaResearchGroup(
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
     * Count default images by school (determined from a research group)
     *
     * @param imageType       the type of images to count (typically DEFAULT_JOB_BANNER)
     * @param researchGroupId the research group ID (used to determine the school)
     * @return the count of default images for that school
     */
    @Query(
        "SELECT COUNT(i) FROM Image i " +
            "JOIN i.researchGroup irg " +
            "JOIN ResearchGroup rg ON rg.researchGroupId = :researchGroupId " +
            "WHERE i.imageType = :imageType AND irg.school = rg.school"
    )
    long countDefaultImagesBySchool(@Param("imageType") ImageType imageType, @Param("researchGroupId") UUID researchGroupId);

    /**
     * Find all default job banner images for a specific school
     *
     * @param imageType the type of images to find (typically DEFAULT_JOB_BANNER)
     * @param school the school to find banners for (e.g., "CIT", "CS")
     * @return a list of default job banners for the school
     */
    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.uploadedBy WHERE i.imageType = :imageType AND i.researchGroup.school = :school")
    List<Image> findByImageTypeAndSchool(@Param("imageType") ImageType imageType, @Param("school") String school);

    /**
     * Find all default job banner images for the school that a research group belongs to
     *
     * @param researchGroupId the research group ID (used to determine the school)
     * @return a list of all default job banners for that school
     */
    default List<Image> findDefaultJobBannersByResearchGroup(UUID researchGroupId) {
        return findDefaultImagesBySchoolViaResearchGroup(ImageType.DEFAULT_JOB_BANNER, researchGroupId);
    }

    /**
     * Find all default job banner images across all schools
     *
     * @return a list of all default job banners from all schools
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
        return findByImageTypeAndSchool(ImageType.DEFAULT_JOB_BANNER, school);
    }
}
