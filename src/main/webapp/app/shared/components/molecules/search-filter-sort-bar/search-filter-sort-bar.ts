import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DrawerModule } from 'primeng/drawer';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';
import { Filter, FilterChange, FilterMultiselect } from '../../atoms/filter-multiselect/filter-multiselect';
import { Sort, SortDirection, SortOption, Sorting } from '../../atoms/sorting/sorting';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-search-filter-sort-bar',
  imports: [
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DrawerModule,
    FontAwesomeModule,
    TranslateModule,
    TranslateDirective,
    FilterMultiselect,
    Sorting,
    ButtonComponent,
  ],
  templateUrl: './search-filter-sort-bar.html',
  styleUrl: './search-filter-sort-bar.scss',
})
export class SearchFilterSortBar {
  // total number of records found
  totalRecords = input<number>(0);
  showRecords = input<boolean>(true);
  searchText = input<string | undefined>(undefined);

  // list of filters to be displayed
  filters = input<Filter[]>([]);

  // list of sort options to be displayed
  sortableFields = input<SortOption[]>();

  // translation keys used for the total number of records found
  // those fields should already be translated within the parent component
  singleEntity = input.required<string>();
  multipleEntities = input.required<string>();

  searchOutput = output<string>();
  filterOutput = output<FilterChange>();
  sortOutput = output<Sort>();

  // text entered in the search input field
  inputText = '';
  isMobileSidebarOpen = false;

  selectedFiltersById = signal<Record<string, string[]>>({});
  selectedSortField = signal<string | undefined>(undefined);
  selectedSortDirection = signal<SortDirection>('DESC');

  readonly hasMobileActions = computed(() => this.filters().length || (this.sortableFields()?.length ?? 0));
  readonly hasActiveFilters = computed(() => Object.values(this.selectedFiltersById()).some(values => values.length));

  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly initializeSortDefaultsEffect = effect(
    () => {
      const fields = this.sortableFields();
      if (!fields || fields.length === 0 || this.selectedSortField() !== undefined) {
        return;
      }

      this.selectedSortField.set(fields[0].fieldName);
    },
    { allowSignalWrites: true },
  );

  onSearch(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.searchOutput.emit(this.inputText);
    }, 300);
  }

  onFilterChange(filterChange: FilterChange): void {
    this.selectedFiltersById.update(previous => ({
      ...previous,
      [filterChange.filterId]: [...filterChange.selectedValues],
    }));
    this.filterOutput.emit(filterChange);
  }

  onSortChange(event: Sort): void {
    this.selectedSortField.set(event.field);
    this.selectedSortDirection.set(event.direction);
    this.sortOutput.emit(event);
  }

  getSelectedFilterValues(filterId: string): string[] {
    return this.selectedFiltersById()[filterId] ?? [];
  }

  openMobileSidebar(): void {
    this.isMobileSidebarOpen = true;
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }

  clearAllFilter(): void {
    const previousSelectedFilters = this.selectedFiltersById();
    const hadSearchText = this.inputText.trim().length;
    const activeFilterIds = Object.entries(previousSelectedFilters)
      .filter(([, values]) => values.length)
      .map(([filterId]) => filterId);
    this.inputText = '';
    this.selectedFiltersById.set({});

    if (hadSearchText) {
      this.searchOutput.emit('');
    }

    if (activeFilterIds.length) {
      activeFilterIds.forEach(filterId =>
        this.filterOutput.emit({
          filterId,
          selectedValues: [],
        }),
      );
    }
  }
}
