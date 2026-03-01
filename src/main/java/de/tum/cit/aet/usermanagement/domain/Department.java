package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@NoUserDataExportRequired(reason = "Organizational master data is not part of user-personal export scope")
@Table(name = "departments")
@Getter
@Setter
public class Department extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "name", nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = false)
    private School school;
}
