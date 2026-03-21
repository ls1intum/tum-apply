package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.core.domain.export.ExportedUserData;
import de.tum.cit.aet.core.domain.export.UserDataExportProviderType;
import de.tum.cit.aet.job.constants.SubjectArea;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a subject area subscription for an applicant.
 * An applicant can subscribe to multiple subject areas to receive relevant notifications.
 * A unique constraint on (user_id, subject_area) ensures no duplicate subscriptions per applicant.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "applicant_subject_area_subscriptions",
    uniqueConstraints = @UniqueConstraint(name = "uc_applicant_subject_area", columnNames = { "user_id", "subject_area" })
)
@ExportedUserData(by = UserDataExportProviderType.APPLICANT)
public class ApplicantSubjectAreaSubscription {

    @Id
    @GeneratedValue
    private UUID subscriptionId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Applicant applicant;

    @Column(name = "subject_area", nullable = false)
    @Enumerated(EnumType.STRING)
    private SubjectArea subjectArea;

    /**
     * Convenience constructor to create a subscription for the given applicant and subject area.
     *
     * @param applicant the applicant to subscribe
     * @param subjectArea the subject area to subscribe to
     */
    public ApplicantSubjectAreaSubscription(Applicant applicant, SubjectArea subjectArea) {
        this.applicant = applicant;
        this.subjectArea = subjectArea;
    }
}
