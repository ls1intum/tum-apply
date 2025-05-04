package de.tum.cit.aet.usermanagement.service.mapper;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class ResearchGroupMapper {

    public List<ResearchGroupDTO> researchGroupsToResearchGroupDTOs(List<ResearchGroup> researchGroups) {
        return researchGroups.stream().filter(Objects::nonNull).map(this::researchGroupToResearchGroupDTO).toList();
    }

    public ResearchGroupDTO researchGroupToResearchGroupDTO(ResearchGroup researchGroup) {
        return new ResearchGroupDTO(
            researchGroup.getId(),
            researchGroup.getName(),
            researchGroup.getAbbreviation(),
            researchGroup.getHead(),
            researchGroup.getEmail(),
            researchGroup.getWebsite(),
            researchGroup.getSchool(),
            researchGroup.getDescription(),
            researchGroup.getDefaultFieldOfStudies(),
            researchGroup.getStreet(),
            researchGroup.getPostalCode(),
            researchGroup.getCity()
        );
    }
}
