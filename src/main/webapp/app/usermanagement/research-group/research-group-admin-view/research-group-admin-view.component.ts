import { CommonModule } from '@angular/common';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupAdminDTO } from 'app/generated/model/researchGroupAdminDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonColor } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { Filter, FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { TranslateDirective } from 'app/shared/language';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

const I18N_BASE = 'researchGroup.adminView';

@Component({
  selector: 'jhi-research-group-admin-view',
  imports: [CommonModule, TagComponent, TranslateModule, TranslateDirective, SearchFilterSortBar, DynamicTableComponent, ConfirmDialog],
  templateUrl: './research-group-admin-view.component.html',
})
export class ResearchGroupAdminView {
  researchGroups = signal<ResearchGroupAdminDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  searchQuery = signal<string>('');

  sortBy = signal<string>('state');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly availableStatusOptions: { key: string; label: string }[] = [
    { key: 'DRAFT', label: `${I18N_BASE}.groupState.draft` },
    { key: 'ACTIVE', label: `${I18N_BASE}.groupState.active` },
    { key: 'DENIED', label: `${I18N_BASE}.groupState.denied` },
  ];

  readonly stateTextMap = computed<Record<string, string>>(() =>
    this.availableStatusOptions.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.key] = cur.label;
      return acc;
    }, {}),
  );

  readonly availableStatusLabels = this.availableStatusOptions.map(option => option.label);

  readonly stateSeverityMap = signal<Record<string, ButtonColor>>({
    DRAFT: 'contrast',
    ACTIVE: 'success',
    DENIED: 'danger',
  });

  readonly buttonTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly selectedStatusFilters = signal<('DRAFT' | 'ACTIVE' | 'DENIED')[]>([]);

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const stateTpl = this.stateTemplate();
    const buttonTpl = this.buttonTemplate();

    return [
      { field: 'professorName', header: `${I18N_BASE}.tableColumn.professor`, width: '14rem' },
      {
        field: 'status',
        header: `${I18N_BASE}.tableColumn.status`,
        width: '8rem',
        alignCenter: true,
        template: stateTpl,
      },
      { field: 'researchGroup', header: `${I18N_BASE}.tableColumn.researchGroup`, width: '26rem' },
      { field: 'createdAt', header: `${I18N_BASE}.tableColumn.requestedAt`, type: 'date', width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: buttonTpl },
    ];
  });

  readonly filters: Filter[] = [
    {
      filterId: 'status',
      filterLabel: `${I18N_BASE}.filter.status`,
      filterSearchPlaceholder: `${I18N_BASE}.filter.stateSearchPlaceholder`,
      filterOptions: this.availableStatusLabels,
      shouldTranslateOptions: true,
    },
  ];

  readonly sortableFields: SortOption[] = [
    { displayName: `${I18N_BASE}.tableColumn.status`, fieldName: 'state', type: 'TEXT' },
    { displayName: `${I18N_BASE}.tableColumn.requestedAt`, fieldName: 'createdAt', type: 'NUMBER' },
  ];

  private toastService = inject(ToastService);
  private researchGroupService = inject(ResearchGroupResourceApiService);

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
    void this.loadResearchGroups();
  }

  onSearchEmit(searchQuery: string): void {
    if (searchQuery !== this.searchQuery()) {
      this.page.set(0);
      this.searchQuery.set(searchQuery);
      void this.loadResearchGroups();
    }
  }

  onFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterId === 'status') {
      this.page.set(0);
      const selectedKeys = this.mapTranslationKeysToEnumValues(filterChange.selectedValues);
      this.selectedStatusFilters.set(selectedKeys);
      void this.loadResearchGroups();
    }
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field);
    this.sortDirection.set(event.direction);
    void this.loadResearchGroups();
  }

  // TODO: Will be implemented in a follow up
  // onViewResearchGroup(researchGroupId: string): void {
  //   // TODO: Navigate to research group detail
  //   console.log('View research group:', researchGroupId);
  // }

  async onApproveResearchGroup(researchGroupId: string): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupService.activateResearchGroup(researchGroupId));
      this.toastService.showSuccessKey(`${I18N_BASE}.success.approve`);
      await this.loadResearchGroups();
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.approve`);
    }
  }

  async onDenyResearchGroup(researchGroupId: string): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupService.denyResearchGroup(researchGroupId));
      this.toastService.showSuccessKey(`${I18N_BASE}.success.deny`);
      await this.loadResearchGroups();
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.deny`);
    }
  }

  async onWithdrawResearchGroup(researchGroupId: string): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupService.withdrawResearchGroup(researchGroupId));
      this.toastService.showSuccessKey(`${I18N_BASE}.success.withdraw`);
      await this.loadResearchGroups();
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.withdraw`);
    }
  }

  private mapTranslationKeysToEnumValues(translationKeys: string[]): ('DRAFT' | 'ACTIVE' | 'DENIED')[] {
    const keyMap = new Map(this.availableStatusOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => (keyMap.get(key) ?? key) as 'DRAFT' | 'ACTIVE' | 'DENIED');
  }

  private async loadResearchGroups(): Promise<void> {
    try {
      const pageData = await firstValueFrom(
        this.researchGroupService.getResearchGroupsForAdmin(
          this.pageSize(),
          this.page(),
          this.selectedStatusFilters(),
          this.searchQuery(),
          this.sortBy(),
          this.sortDirection(),
        ),
      );
      this.researchGroups.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.loadResearchGroups`);
    }
  }
}
