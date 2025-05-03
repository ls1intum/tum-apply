package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.application.domain.Application;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationEvaluationRepository extends JpaRepository<Application, UUID> {
    List<Application> findAll(Specification<Application> spec);
}
