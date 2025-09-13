import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { SelectComponent, SelectOption } from '../../atoms/select/select.component';
import { FilterField } from '../../../filter';
import TranslateDirective from '../../../language/translate.directive';

export interface SortOption {
  displayName: string;
  field: string;
  direction: 'ASC' | 'DESC';
}

@Component({
  selector: 'jhi-filter-sort-bar',
  imports: [SelectComponent, FontAwesomeModule, TranslateModule, TranslateDirective],
  templateUrl: './filter-sort-bar.component.html',
  styleUrl: './filter-sort-bar.component.scss',
})
export class FilterSortBarComponent {
  totalRecords = input<number>(0);
  sortOptions = input<SortOption[]>();
  preSelectedSortOption = input<SortOption | undefined>();
  filterFields = model<FilterField[]>([]);

  // translation keys used for the total number of records found
  // those fields should already be translated within the parent component
  singleEntity = input.required<string>();
  multipleEntities = input.required<string>();

  currentSortOption = signal<SortOption | undefined>(undefined);
  filterDialogVisible = signal<boolean>(false);

  filterChange = output<FilterField[]>();
  sortChange = output<SortOption>();

  // Computes the total number of active filters
  activeFilters = computed(() => {
    return this.filterFields().filter(f => f.selected.length > 0).length;
  });

  // Determines the selected sort option for the select component
  readonly selectedSortSelectOption = computed<SelectOption>(() => {
    let cur: SortOption | undefined;

    if (this.currentSortOption()) {
      cur = this.currentSortOption();
    } else if ((this.sortOptions() ?? []).length > 0) {
      cur = this.sortOptions()![0];
    }

    if (cur) {
      return { name: cur.displayName, value: this.encodeSortValue(cur) };
    }
    // fallback if no currentSortOption and no sortOptions
    return { name: '', value: '' };
  });

  // Generates selection options from sort options
  readonly sortSelectOptions = computed<SelectOption[]>(
    () =>
      this.sortOptions()?.map(opt => ({
        name: opt.displayName,
        value: this.encodeSortValue(opt),
      })) ?? [],
  );

  constructor() {
    // Effect to initialize currentSortOption if a pre-selected sort is provided
    effect(() => {
      const preSelectedSort = this.preSelectedSortOption();
      if (preSelectedSort) {
        this.currentSortOption.set(preSelectedSort);
      }
    });
  }

  updateFilters(newFilters: FilterField[]): void {
    console.warn('Emitting Filters: ', newFilters);
    this.filterFields.set(newFilters);
    this.filterChange.emit(this.filterFields());
  }

  updateSort(opt: SelectOption): void {
    // Decodes select option and finds matching SortOption
    const match = this.sortOptions()?.find(so => {
      const sortOption = this.decodeSortValue(opt.value as string);
      return so.field === sortOption?.field && so.direction === sortOption.direction;
    });
    console.warn('Emitting Sort ', match);

    if (match !== undefined) {
      this.currentSortOption.set(match);
      this.sortChange.emit(match);
    }
  }

  // Encodes SortOption into string for select value
  encodeSortValue(option: SortOption): string {
    return option.field + '|' + option.direction;
  }

  // Decodes select string value back to SortOption
  decodeSortValue(value: string): SortOption | undefined {
    const parts = value.split('|');

    if (isDirection(parts[1])) {
      return {
        displayName: '',
        field: parts[0],
        direction: parts[1],
      };
    } else {
      return undefined;
    }
  }
}

function isDirection(value: string): value is 'ASC' | 'DESC' {
  return value === 'ASC' || value === 'DESC';
}
