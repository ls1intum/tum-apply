package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResearchGroupRepository extends JpaRepository<ResearchGroup, UUID> {}
