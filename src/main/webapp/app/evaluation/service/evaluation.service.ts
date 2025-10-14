import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { JobFilterOptionDTO } from 'app/generated/model/jobFilterOptionDTO';

import { filterFields } from '../filterSortOptions';
import { FilterField } from '../../shared/filter';
import { ApplicationEvaluationResourceApiService } from '../../generated/api/applicationEvaluationResourceApi.service';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private filterFields: FilterField[] = filterFields.map(f => f.clone());

  private readonly evaluationService = inject(ApplicationEvaluationResourceApiService);

  async getJobFilterOptions(): Promise<JobFilterOptionDTO[]> {
    return await firstValueFrom(this.evaluationService.getJobFilterOptions());
  }

  collectFiltersByKey(filters: FilterField[]): Record<string, Set<string> | undefined> {
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
