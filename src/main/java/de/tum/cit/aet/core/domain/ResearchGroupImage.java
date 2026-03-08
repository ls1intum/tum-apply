package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Job banner images uploaded by professors and shared within their research group.
 * These images can be used by any professor in the same research group when creating jobs.
 */
@Entity
@NoUserDataExportRequired(reason = "Images are exported as binary files by UserExportZipWriter")
@Getter
@Setter
@DiscriminatorValue("JOB_BANNER")
public class ResearchGroupImage extends Image {

    @ManyToOne
    @JoinColumn(name = "research_group_id")
    @NotNull
    private ResearchGroup researchGroup;
}
