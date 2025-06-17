import { Component, computed, input, model, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button/button.component';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { DropdownComponent, DropdownOption } from '../../atoms/dropdown/dropdown.component';

export interface FilterField {
  displayName: string;
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
  sortOptions = input<SortOption[]>();

  currentSortOption = signal<SortOption | undefined>(undefined);

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
      return { name: cur.displayName, value: cur.field };
    }
    // fallback if no currentSortOption and no sortOptions
    return { name: '', value: '' };
  });

  readonly sortDropdownOptions = computed<DropdownOption[]>(
    () =>
      this.sortOptions()?.map(opt => ({
        name: opt.displayName,
        value: opt.field,
      })) ?? [],
  );

  filterDialogVisible = signal<boolean>(false);

  updateFilters(newFilters: FilterField[]): void {
    console.warn('Update Filters: ', newFilters);
    this.filterFields.set(newFilters);
    this.filterChange.emit(this.filterFields());
  }

  updateSort(opt: DropdownOption): void {
    const match = this.sortOptions()?.find(so => so.field === opt.value);
    console.warn('Update Sort ', match);

    if (match !== undefined) {
      this.currentSortOption.set(match);
      this.sortChange.emit(match);
    }
  }
}
