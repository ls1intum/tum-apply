import { Component, computed, input, model, output, signal } from '@angular/core';
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
  filterFields = model<FilterField[]>([]);
  currentSortOption = model<SortOption | undefined>(undefined);

  sortOptions = input<SortOption[]>();

  filterChange = output<FilterField[]>();
  sortChange = output<SortOption>();

  activeFilters = computed(() => {
    return this.filterFields()
      .map(f => f.selected?.length ?? 0)
      .reduce((sum, count) => sum + count, 0);
  });

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

  readonly sortDropdownOptions = computed<DropdownOption[]>(
    () =>
      this.sortOptions()?.map(opt => ({
        name: opt.displayName,
        value: this.encodeSortValue(opt),
      })) ?? [],
  );

  filterDialogVisible = signal<boolean>(false);

  updateFilters(newFilters: FilterField[]): void {
    console.warn('Emitting Filters: ', newFilters);
    this.filterFields.set(newFilters);
    this.filterChange.emit(this.filterFields());
  }

  updateSort(opt: DropdownOption): void {
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

  encodeSortValue(option: SortOption): string {
    return option.field + '|' + option.direction;
  }

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
