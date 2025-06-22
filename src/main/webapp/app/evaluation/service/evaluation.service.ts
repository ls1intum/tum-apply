import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { filterFields } from '../filterSortOptions';
import { FilterField } from '../../shared/filter';
import { JobFilterOptionDTO } from 'app/generated/model/jobFilterOptionDTO';
import { ApplicationEvaluationResourceService } from 'app/generated/api/applicationEvaluationResource.service';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private filterFields: FilterField[] = JSON.parse(JSON.stringify(filterFields));

  private readonly evaluationService = inject(ApplicationEvaluationResourceService);

  async getJobFilterOptions(): Promise<JobFilterOptionDTO[]> {
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
