import { Component, effect, input, output, signal } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChipModule } from 'primeng/chip';

import { FilterOption } from '../../molecules/filter-sort-bar/filter-sort-bar.component';
import { TranslateDirective } from '../../../language';

@Component({
  selector: 'jhi-filter-select',
  imports: [ChipModule, FormsModule, MultiSelectModule, TranslateModule, TranslateDirective],
  templateUrl: './filter-select.component.html',
  styleUrl: './filter-select.component.scss',
})
export class FilterSelectComponent {
  options = input.required<FilterOption[]>();
  preSelected = input<FilterOption[] | undefined>(undefined);
  width = input<string>('100%');

  selectedOptions = signal<FilterOption[]>([]);

  selectionChange = output<FilterOption[]>();

  constructor() {
    effect(() => {
      this.selectedOptions.set(this.preSelected() ?? []);
    });
  }

  handleChipRemove(evt: MouseEvent, item: FilterOption): void {
    // prevent the click from bubbling up to the multiselect host
    evt.stopPropagation();

    this.selectedOptions.update(list => list.filter(i => i !== item));
    this.onSelectionChange();
  }

  onSelectionChange(): void {
    this.selectionChange.emit(this.selectedOptions());
  }
}
