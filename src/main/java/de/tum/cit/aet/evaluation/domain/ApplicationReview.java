package de.tum.cit.aet.evaluation.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@Setter
@Table(name = "application_reviews")
public class ApplicationReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "application_review_id", nullable = false)
    private UUID applicationReviewId;

    @OneToOne
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private Application application;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User reviewedBy;

    @Column(name = "reason")
    private String reason;

    @CreationTimestamp
    @Column(name = "reviewed_at")
    private ZonedDateTime reviewedAt;
}
