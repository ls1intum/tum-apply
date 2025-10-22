import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupAdminDTO } from 'app/generated/model/researchGroupAdminDTO';
import { ToastService } from 'app/service/toast-service';
import { Filter, FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { TranslateDirective } from 'app/shared/language';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

const I18N_BASE = 'researchGroup.adminView';

@Component({
  selector: 'jhi-research-group-admin-view',
  imports: [TranslateModule, TranslateDirective, SearchFilterSortBar, DynamicTableComponent],
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

  readonly availableStatusLabels = this.availableStatusOptions.map(option => option.label);

  // readonly buttonTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  // readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly selectedStatusFilters = signal<string[]>([]);

  readonly columns = computed<DynamicTableColumn[]>(() => {
    // const stateTpl = this.stateTemplate();
    // const buttonTpl = this.buttonTemplate();

    return [
      { field: 'professorName', header: `${I18N_BASE}.tableColumn.professor`, width: '12rem' },
      {
        field: 'status',
        header: `${I18N_BASE}.tableColumn.status`,
        width: '10rem',
        alignCenter: true,
        /* template: stateTpl, */
      },
      { field: 'researchGroup', header: `${I18N_BASE}.tableColumn.researchGroup`, width: '26rem' },
      { field: 'createdAt', header: `${I18N_BASE}.tableColumn.createdAt`, width: '10rem' },
      { field: 'actions', header: '', width: '5rem' /* template: buttonTpl */ },
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
    { displayName: `${I18N_BASE}.tableColumn.createdAt`, fieldName: 'createdAt', type: 'NUMBER' },
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
    const normalizedQuery = searchQuery.trim().replace(/\s+/g, ' ');
    const currentQuery = this.searchQuery().trim().replace(/\s+/g, ' ');

    if (normalizedQuery !== currentQuery) {
      this.page.set(0);
      this.searchQuery.set(normalizedQuery);
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

  private mapTranslationKeysToEnumValues(translationKeys: string[]): string[] {
    const keyMap = new Map(this.availableStatusOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => keyMap.get(key) ?? key);
  }

  private async loadResearchGroups(): Promise<void> {
    try {
      const pageData = await firstValueFrom(
        this.researchGroupService.getResearchGroupsForAdmin(
          this.page(),
          this.pageSize(),
          this.selectedStatusFilters(),
          this.sortBy(),
          this.sortDirection(),
          this.searchQuery(),
        ),
      );
      this.researchGroups.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.loadResearchGroups`);
    }
  }
}
