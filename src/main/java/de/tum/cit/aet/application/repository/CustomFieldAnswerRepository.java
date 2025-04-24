package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomFieldAnswerRepository extends JpaRepository<CustomFieldAnswer, UUID> {}
