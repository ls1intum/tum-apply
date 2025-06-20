import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button/button.component';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { DropdownComponent, DropdownOption } from '../../atoms/dropdown/dropdown.component';

export interface FilterField {
  translationKey: string;
  field: string;
  options: FilterOption[];
  selected?: FilterOption[];
}

export interface FilterOption {
  displayName: string;
  field: string;
  translationKey: string | undefined;
}

export interface SortOption {
  displayName: string;
  field: string;
  direction: 'ASC' | 'DESC';
}

@Component({
  selector: 'jhi-filter-sort-bar',
  imports: [ButtonComponent, FilterDialogComponent, DropdownComponent, FontAwesomeModule, TranslateModule],
  templateUrl: './filter-sort-bar.component.html',
  styleUrl: './filter-sort-bar.component.scss',
})
export class FilterSortBarComponent {
  totalRecords = input<number>(0);
  sortOptions = input<SortOption[]>();
  preSelectedSortOption = input<SortOption | undefined>();
  filterFields = model<FilterField[]>([]);

  currentSortOption = signal<SortOption | undefined>(undefined);
  filterDialogVisible = signal<boolean>(false);

  filterChange = output<FilterField[]>();
  sortChange = output<SortOption>();

  // Computes the total number of active filters
  activeFilters = computed(() => {
    return this.filterFields().filter(f => (f.selected?.length ?? 0) > 0).length;
  });

  // Determines the selected sort option for the dropdown
  readonly selectedSortDropdownOption = computed<DropdownOption>(() => {
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

  // Generates dropdown options from sort options
  readonly sortDropdownOptions = computed<DropdownOption[]>(
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

  updateSort(opt: DropdownOption): void {
    // Decodes dropdown option and finds matching SortOption
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

  // Encodes SortOption into string for dropdown value
  encodeSortValue(option: SortOption): string {
    return option.field + '|' + option.direction;
  }

  // Decodes dropdown string value back to SortOption
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
