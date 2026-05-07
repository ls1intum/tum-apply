package de.tum.cit.aet.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.dto.AdminApplicationOverviewDTO;
import de.tum.cit.aet.application.domain.dto.AdminApplicationsFilterDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private ApplicationService applicationService;

    @Test
    void shouldDelegateToRepositoryWithFiltersForAdmin() {
        PageDTO pageDTO = new PageDTO(10, 0);
        SortDTO sortDTO = new SortDTO("createdAt", SortDTO.Direction.DESC);
        UUID rgId = UUID.randomUUID();
        UUID profId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();
        AdminApplicationsFilterDTO filter = new AdminApplicationsFilterDTO(
            List.of("SAVED", "SENT"),
            List.of(rgId),
            List.of(profId),
            List.of(jobId)
        );
        Page<AdminApplicationOverviewDTO> expected = Page.empty();
        when(applicationRepository.findAllApplicationsForAdmin(any(), any(), any(), any(), any(), any())).thenReturn(expected);

        Page<AdminApplicationOverviewDTO> result = applicationService.getAllApplicationsForAdmin(pageDTO, filter, sortDTO, "needle");

        assertThat(result).isSameAs(expected);
        verify(applicationRepository).findAllApplicationsForAdmin(
            eq(List.of(ApplicationState.SAVED, ApplicationState.SENT)),
            eq(List.of(rgId)),
            eq(List.of(profId)),
            eq(List.of(jobId)),
            eq("needle"),
            any(Pageable.class)
        );
    }

    @Test
    void shouldPassNullsToRepositoryWhenAllFiltersEmpty() {
        PageDTO pageDTO = new PageDTO(10, 0);
        SortDTO sortDTO = new SortDTO("createdAt", SortDTO.Direction.DESC);
        AdminApplicationsFilterDTO empty = new AdminApplicationsFilterDTO(List.of(), List.of(), List.of(), List.of());
        when(applicationRepository.findAllApplicationsForAdmin(any(), any(), any(), any(), any(), any())).thenReturn(Page.empty());

        applicationService.getAllApplicationsForAdmin(pageDTO, empty, sortDTO, null);

        verify(applicationRepository).findAllApplicationsForAdmin(
            isNull(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)
        );
    }
}
