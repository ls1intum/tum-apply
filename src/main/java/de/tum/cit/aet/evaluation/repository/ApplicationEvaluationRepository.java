package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.repository.custom.ApplicationEvaluationRepositoryCustom;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationEvaluationRepository extends TumApplyJpaRepository<Application, UUID>, ApplicationEvaluationRepositoryCustom {}
