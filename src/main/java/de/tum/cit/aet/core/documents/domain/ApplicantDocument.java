package de.tum.cit.aet.core.documents.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

/**
 * Document owned by an applicant's profile (CV, transcripts, references).
 * Persists across all of the applicant's applications and is reused (path-copied) when the applicant submits.
 */
@Entity
@DiscriminatorValue("APPLICANT")
@NoUserDataExportRequired(reason = "Documents are exported as binary files by UserExportZipWriter")
@Getter
@Setter
public class ApplicantDocument extends Document {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id")
    @JsonIgnoreProperties({ "submittedApplications", "applicantDocuments" })
    private Applicant applicant;
}
