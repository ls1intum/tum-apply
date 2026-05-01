package de.tum.cit.aet.core.documents.domain;

import de.tum.cit.aet.application.domain.Application;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

/**
 * Document attached to a specific application — a snapshot at submit time.
 * Created by copying an applicant-owned document; references the same path on disk.
 */
@Entity
@DiscriminatorValue("APPLICATION")
@Getter
@Setter
public class ApplicationDocument extends Document {

    @ManyToOne(optional = false)
    @JoinColumn(name = "application_id")
    private Application application;
}
