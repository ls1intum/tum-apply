package de.tum.cit.aet.usermanagement.api;

import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/research-groups")
public class ResearchGroupController {

    private final ResearchGroupService service;

    public ResearchGroupController(ResearchGroupService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public List<ResearchGroupDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasGroupRole('ADMIN', #id)")
    public ResearchGroupDTO getById(@PathVariable UUID id) {
        return service.findById(id);
    }
}
