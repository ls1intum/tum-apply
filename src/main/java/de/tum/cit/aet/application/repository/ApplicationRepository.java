package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.Application;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Application} entity.
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {}
