package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.Department;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Department} entity.
 */
@Repository
public interface DepartmentRepository extends TumApplyJpaRepository<Department, UUID> {
    @NotNull
    default Department findByIdElseThrow(UUID departmentId) {
        return getArbitraryValueElseThrow(findById(departmentId));
    }

    List<Department> findBySchoolSchoolId(UUID schoolId);

    boolean existsByNameIgnoreCaseAndSchoolSchoolId(String name, UUID schoolId);
}
