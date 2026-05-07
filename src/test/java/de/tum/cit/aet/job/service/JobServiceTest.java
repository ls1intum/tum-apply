package de.tum.cit.aet.job.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.dto.AdminCreatedJobDTO;
import de.tum.cit.aet.job.dto.AdminJobsFilterDTO;
import de.tum.cit.aet.job.repository.JobRepository;
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
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private JobService jobService;

    @Test
    void shouldDelegateToRepositoryWithFiltersForAdmin() {
        PageDTO pageDTO = new PageDTO(10, 0);
        SortDTO sortDTO = new SortDTO("lastModifiedAt", SortDTO.Direction.DESC);
        UUID rgId = UUID.randomUUID();
        UUID profId = UUID.randomUUID();
        AdminJobsFilterDTO filter = new AdminJobsFilterDTO(List.of("DRAFT", "PUBLISHED"), List.of(rgId), List.of(profId));
        Page<AdminCreatedJobDTO> expected = Page.empty();
        when(jobRepository.findAllJobsForAdmin(any(), any(), any(), any(), any())).thenReturn(expected);

        Page<AdminCreatedJobDTO> result = jobService.getAllJobs(pageDTO, filter, sortDTO, "needle");

        assertThat(result).isSameAs(expected);
        verify(jobRepository).findAllJobsForAdmin(
            eq(List.of(JobState.DRAFT, JobState.PUBLISHED)),
            eq(List.of(rgId)),
            eq(List.of(profId)),
            eq("needle"),
            any(Pageable.class)
        );
    }

    @Test
    void shouldPassNullsToRepositoryWhenAllFiltersEmpty() {
        PageDTO pageDTO = new PageDTO(10, 0);
        SortDTO sortDTO = new SortDTO("lastModifiedAt", SortDTO.Direction.DESC);
        AdminJobsFilterDTO empty = new AdminJobsFilterDTO(List.of(), List.of(), List.of());
        when(jobRepository.findAllJobsForAdmin(any(), any(), any(), any(), any())).thenReturn(Page.empty());

        jobService.getAllJobs(pageDTO, empty, sortDTO, null);

        verify(jobRepository).findAllJobsForAdmin(isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }
}
