package de.tum.cit.aet.evaluation.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "internal_comments")
public class InternalComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID internalCommentId;

    @ManyToOne
    @JoinColumn(name = "application")
    private Application application;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    private String message;
}
