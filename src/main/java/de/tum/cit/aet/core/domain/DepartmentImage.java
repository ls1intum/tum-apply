package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import de.tum.cit.aet.usermanagement.domain.Department;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Default job banner images uploaded by admins and shared within a department.
 * These images are available to all research groups within the same department.
 */
@Entity
@NoUserDataExportRequired(reason = "Images are exported as binary files by UserExportZipWriter")
@Getter
@Setter
@DiscriminatorValue("DEFAULT_JOB_BANNER")
public class DepartmentImage extends Image {

    @ManyToOne
    @JoinColumn(name = "department_id")
    @NotNull
    private Department department;
}
