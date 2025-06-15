import { Component, effect, input, output } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  displayName: string;
  field: string;
}
@Component({
  selector: 'jhi-filter-select',
  imports: [FormsModule, MultiSelectModule],
  templateUrl: './filter-select.component.html',
  styleUrl: './filter-select.component.scss',
})
export class FilterSelectComponent {
  options = input.required<FilterOption[]>();
  preSelected = input<FilterOption[] | null>(null);
  width = input<string>('100%');

  selectedOptions: FilterOption[] = [];

  selectionChange = output<FilterOption[]>();

  constructor() {
    effect(() => {
      this.selectedOptions = this.preSelected() ?? [];
    });
  }

  onSelectionChange(): void {
    this.selectionChange.emit(this.selectedOptions);
  }
}
