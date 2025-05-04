package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomFieldAnswerRepository extends TumApplyJpaRepository<CustomFieldAnswer, UUID> {}
