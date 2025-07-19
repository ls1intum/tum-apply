package de.tum.cit.aet.core.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Base abstract class for entities which will hold definitions for created, last modified, created by,
 * last modified by attributes.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(value = { "createdAt", "lastModifiedAt" }, allowGetters = true)
@Getter
public abstract class AbstractAuditingEntity implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @CreatedDate
    @Column(name = "created_at", updatable = false, columnDefinition = "DATETIME(3)")
    private LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    @LastModifiedDate
    @Column(name = "last_modified_at", columnDefinition = "DATETIME(3)")
    private LocalDateTime lastModifiedAt = LocalDateTime.now(ZoneOffset.UTC);
}
