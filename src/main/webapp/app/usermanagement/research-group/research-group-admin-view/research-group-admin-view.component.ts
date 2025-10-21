import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Filter } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { TranslateDirective } from 'app/shared/language';

const I18N_BASE = 'researchGroup.adminView';

@Component({
  selector: 'jhi-research-group-admin-view',
  imports: [TranslateModule, TranslateDirective, SearchFilterSortBar],
  templateUrl: './research-group-admin-view.component.html',
})
export class ResearchGroupAdminView {
  totalRecords = signal<number>(0);

  readonly availableStatusOptions: { key: string; label: string }[] = [
    { key: 'DRAFT', label: `${I18N_BASE}.groupState.draft` },
    { key: 'ACTIVE', label: `${I18N_BASE}.groupState.active` },
    { key: 'DENIED', label: `${I18N_BASE}.groupState.denied` },
  ];

  readonly availableStatusLabels = this.availableStatusOptions.map(option => option.label);

  readonly filters: Filter[] = [
    {
      filterId: 'status',
      filterLabel: `${I18N_BASE}.filter.status`,
      filterSearchPlaceholder: `${I18N_BASE}.filter.searchPlaceholder`,
      filterOptions: this.availableStatusLabels,
      shouldTranslateOptions: true,
    },
  ];

  readonly sortableFields: SortOption[] = [
    { displayName: `${I18N_BASE}.tableColumn.status`, fieldName: 'status', type: 'TEXT' },
    { displayName: `${I18N_BASE}.tableColumn.createdAt`, fieldName: 'createdAt', type: 'NUMBER' },
  ];
}
