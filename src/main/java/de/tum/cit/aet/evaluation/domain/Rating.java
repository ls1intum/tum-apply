package de.tum.cit.aet.evaluation.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "ratings",
    uniqueConstraints = @UniqueConstraint(name = "uc_ratings_application_user", columnNames = { "application_id", "user_id" })
)
@Getter
@Setter
public class Rating extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rating_id", nullable = false)
    private UUID ratingId;

    @ManyToOne
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "rating")
    private Integer rating;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User from;
}
