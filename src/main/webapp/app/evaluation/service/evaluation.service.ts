import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApplicationEvaluationResourceService, JobFilterOptionDTO } from '../../generated';
import { filterFields } from '../filterSortOptions';
import { FilterField } from '../../shared/filter';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private filterFields: FilterField[] = JSON.parse(JSON.stringify(filterFields));

  private readonly evaluationService = inject(ApplicationEvaluationResourceService);

  async getJobFilterOptions(): Promise<Set<JobFilterOptionDTO>> {
    return await firstValueFrom(this.evaluationService.getJobFilterOptions());
  }

  async getFilterFields(): Promise<FilterField[]> {
    const jobFilters = await this.getJobFilterOptions();

    const jobOptions = Array.from(jobFilters).map(job => ({
      displayName: job.jobName ?? '',
      field: job.jobId ?? '',
      translationKey: undefined,
    }));

    const jobField = this.filterFields.find(f => f.field === 'job');
    if (jobField) {
      jobField.options = jobOptions;
      jobField.selected = [];
    }

    return this.filterFields;
  }
}
