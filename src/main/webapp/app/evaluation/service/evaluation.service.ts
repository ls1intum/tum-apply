import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApplicationEvaluationResourceService, JobFilterOptionDTO } from '../../generated';
import { filterFields } from '../filterSortOptions';
import { FilterField, FilterOption } from '../../shared/filter';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private filterFields: FilterField[] = filterFields.map(f => f.clone());

  private readonly evaluationService = inject(ApplicationEvaluationResourceService);

  async getJobFilterOptions(): Promise<Set<JobFilterOptionDTO>> {
    return await firstValueFrom(this.evaluationService.getJobFilterOptions());
  }

  async getFilterFields(): Promise<FilterField[]> {
    const jobFilters = await this.getJobFilterOptions();

    const jobOptions: FilterOption[] = [];

    Array.from(jobFilters).forEach(job => jobOptions.push(new FilterOption(job.jobName ?? '', job.jobId ?? '', undefined)));

    const jobField = this.filterFields.find(f => f.field === 'job');
    if (jobField) {
      jobField.options = jobOptions;
      jobField.selected = [];
    }

    return this.filterFields;
  }

  collectFiltersByKey(filters: FilterField[]): Record<string, Set<string>> {
    const filtersByKey: Record<string, Set<string>> = {};

    filters.forEach(f => {
      const entry = f.getQueryParamEntry();
      if (!entry) {
        return;
      }
      const [key, value] = entry;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!filtersByKey[key]) {
        filtersByKey[key] = new Set<string>();
      }

      value.split(',').forEach(v => {
        filtersByKey[key].add(v);
      });
    });

    return filtersByKey;
  }
}
