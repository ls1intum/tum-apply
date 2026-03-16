package de.tum.cit.aet.notification.domain;

import de.tum.cit.aet.core.domain.export.ExportedUserData;
import de.tum.cit.aet.core.domain.export.UserDataExportProviderType;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Stores a single subject-area subscription for an applicant.
 *
 * <p>The unique constraint on {@code applicant_id + subject_area} ensures that
 * the same applicant cannot subscribe to the same subject area more than once.</p>
 */
@Entity
@ExportedUserData(by = UserDataExportProviderType.APPLICANT)
@Getter
@Setter
@Table(
    name = "applicant_subject_area_subscriptions",
    uniqueConstraints = { @UniqueConstraint(columnNames = { "applicant_id", "subject_area" }) }
)
public class ApplicantSubjectAreaSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "applicant_subject_area_subscription_id", nullable = false, updatable = false)
    private UUID applicantSubjectAreaSubscriptionId;

    /** Applicant who owns this subscription entry. */
    @ManyToOne
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    /** Canonical subject-area enum value persisted for later notification matching. */
    @Enumerated(EnumType.STRING)
    @Column(name = "subject_area", nullable = false)
    private SubjectArea subjectArea;
}
