package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.service.mapper.ResearchGroupMapper;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ResearchGroupService {

    private final ResearchGroupRepository repository;
    private final ResearchGroupMapper mapper;

    public ResearchGroupService(ResearchGroupRepository repository, ResearchGroupMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public List<ResearchGroupDTO> findAll() {
        return mapper.researchGroupsToResearchGroupDTOs(repository.findAll());
    }

    public ResearchGroupDTO findById(UUID id) {
        return repository
            .findById(id)
            .map(mapper::researchGroupToResearchGroupDTO)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
    }
}
