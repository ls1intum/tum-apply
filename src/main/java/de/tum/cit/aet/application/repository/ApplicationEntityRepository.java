package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import java.util.List;
import java.util.UUID;

public interface ApplicationEntityRepository {
    public List<ApplicationOverviewDTO> findApplicationsByApplicant(UUID applicantId, int pageNumber, int pageSize);
}
