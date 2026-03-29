import { computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { ApplicantSubjectAreaSubscriptionsEnum } from 'app/generated/model/applicant';
import { ToastService } from 'app/service/toast-service';
import * as DropDownOptions from 'app/job/dropdown-options';

import { FilterChange } from '../../components/atoms/filter-multiselect/filter-multiselect';

export type SubjectArea = ApplicantSubjectAreaSubscriptionsEnum;

export class SubjectAreaSubscriptionsStore {
  readonly saving = signal(false);
  readonly enabled = signal(false);
  readonly selected = signal<SubjectArea[]>([]);
  readonly options = DropDownOptions.subjectAreas.map(option => ({
    name: option.name,
    value: option.value as SubjectArea,
  }));
  readonly filterOptions: string[] = this.options.map(option => option.name);
  readonly selectedFilterValues = computed(() =>
    this.selected()
      .map(subjectArea => DropDownOptions.subjectAreaValueToNameMap.get(subjectArea))
      .filter((subjectAreaName): subjectAreaName is string => subjectAreaName !== undefined),
  );
  readonly selectedOptions = computed(() => {
    const selectedAreas = new Set(this.selected());
    return this.options.filter(option => selectedAreas.has(option.value));
  });

  private readonly applicantApi = inject(ApplicantResourceApi);
  private readonly toastService = inject(ToastService);

  async load(): Promise<void> {
    try {
      const subscriptions = await firstValueFrom(this.applicantApi.getSubjectAreaSubscriptions());
      this.selected.set(this.sortSubjectAreas(subscriptions as SubjectArea[]));
    } catch {
      this.reset();
      this.toastService.showError({ summary: 'Error', detail: 'loading the subject area subscriptions' });
    }
  }

  reset(): void {
    this.selected.set([]);
    this.enabled.set(false);
  }

  async updateSelection(subjectAreas: SubjectArea[] | null | undefined): Promise<void> {
    const nextSelection = this.sortSubjectAreas(subjectAreas ?? []);
    const previousSelection = this.selected();

    if (JSON.stringify(previousSelection) === JSON.stringify(nextSelection)) {
      return;
    }

    const previousSet = new Set(previousSelection);
    const nextSet = new Set(nextSelection);
    const subjectAreasToAdd = nextSelection.filter(subjectArea => !previousSet.has(subjectArea));
    const subjectAreasToRemove = previousSelection.filter(subjectArea => !nextSet.has(subjectArea));

    this.selected.set(nextSelection);
    this.saving.set(true);

    try {
      const updateRequests = subjectAreasToAdd
        .map(subjectArea => firstValueFrom(this.applicantApi.addSubjectAreaSubscription(subjectArea)))
        .concat(subjectAreasToRemove.map(subjectArea => firstValueFrom(this.applicantApi.removeSubjectAreaSubscription(subjectArea))));
      await Promise.all(updateRequests);
    } catch {
      this.selected.set(previousSelection);
      this.toastService.showError({ summary: 'Error', detail: 'updating the subject area subscriptions' });
      await this.load();
    } finally {
      this.saving.set(false);
    }
  }

  async remove(subjectArea: SubjectArea): Promise<void> {
    await this.updateSelection(this.selected().filter(selectedSubjectArea => selectedSubjectArea !== subjectArea));
  }

  setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);
  }

  onFilterChange(filterChange: FilterChange): void {
    void this.updateSelection(DropDownOptions.mapSubjectAreaNames(filterChange.selectedValues) as SubjectArea[]);
  }

  private sortSubjectAreas(subjectAreas: readonly SubjectArea[]): SubjectArea[] {
    const subjectAreaSet = new Set(subjectAreas);
    return this.options.filter(option => subjectAreaSet.has(option.value)).map(option => option.value);
  }
}
