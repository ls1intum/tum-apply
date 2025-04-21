package de.tum.cit.aet.job.repository;

import de.tum.cit.aet.job.domain.Job;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {}
