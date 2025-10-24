package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupAdminDTO;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface ResearchGroupRepository extends TumApplyJpaRepository<ResearchGroup, UUID> {
    @NotNull
    default ResearchGroup findByIdElseThrow(UUID researchGroupId) {
        return getArbitraryValueElseThrow(findById(researchGroupId));
    }

    @NotNull
    default ResearchGroup findByUniversityIdElseThrow(String universityId) {
        return getArbitraryValueElseThrow(findByUniversityId(universityId));
    }

    Optional<ResearchGroup> findByUniversityId(String universityId);

    boolean existsByNameIgnoreCase(String name);
    Optional<ResearchGroup> findByNameIgnoreCase(String name);

    List<ResearchGroup> findByState(ResearchGroupState state);
    Page<ResearchGroup> findByState(ResearchGroupState state, Pageable pageable);

    @Query(
        """
            SELECT new de.tum.cit.aet.usermanagement.dto.ResearchGroupAdminDTO(
                rg.researchGroupId,
                rg.name,
                rg.head,
                rg.state,
                rg.createdAt
            )
            FROM ResearchGroup rg
            WHERE (:states IS NULL OR rg.state IN :states)
            AND (:searchQuery IS NULL OR
                 LOWER(rg.name) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR
                 LOWER(rg.head) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR
                 LOWER(rg.abbreviation) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
            )
        """
    )
    Page<ResearchGroupAdminDTO> findAllForAdmin(
        @Param("states") List<ResearchGroupState> states,
        @Param("searchQuery") String searchQuery,
        Pageable pageable
    );
}
