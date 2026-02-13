package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

/**
 * Profile picture images uploaded by users.
 * These images are personal and not shared with any group or department.
 */
@Entity
@NoUserDataExportRequired(reason = "Images are exported as binary files by UserExportZipWriter")
@Getter
@Setter
@DiscriminatorValue("PROFILE_PICTURE")
public class ProfileImage extends Image {
    // No additional fields - profile pictures have no group or department association
}
