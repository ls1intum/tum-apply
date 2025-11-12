package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ApplicationEntityRepository {
    Page<ApplicationOverviewDTO> findApplicationsByApplicant(UUID applicantId, Pageable pageable);
}
