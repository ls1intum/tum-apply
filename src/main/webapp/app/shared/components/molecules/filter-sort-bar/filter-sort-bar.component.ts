import { Component, computed, input, signal } from '@angular/core';

import { ButtonComponent } from '../../atoms/button/button.component';
import { FilterDialogComponent, FilterField } from '../filter-dialog/filter-dialog.component';

@Component({
  selector: 'jhi-filter-sort-bar',
  imports: [ButtonComponent, FilterDialogComponent],
  templateUrl: './filter-sort-bar.component.html',
  styleUrl: './filter-sort-bar.component.scss',
})
export class FilterSortBarComponent {
  totalRecords = input<number>(0);
  filterFields = input<FilterField[]>([]);
  sortable = input<boolean>(false);

  activeFilters = computed(() => {});
  filterDialogVisible = signal<boolean>(false);
}
