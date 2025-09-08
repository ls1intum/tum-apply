import { Component, ViewEncapsulation, computed, input, signal } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-filter-multiselect',
  imports: [MultiSelectModule, FormsModule, TranslateModule],
  templateUrl: './filter-multiselect.html',
  styleUrl: './filter-multiselect.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FilterMultiselect {
  filterLabel = input.required<string>();
  filterOptions = input<string[]>([]);

  selectedValues = signal<string[]>([]);

  sortedOptions = computed(() => {
    const selected = this.selectedValues();
    const options = this.filterOptions();

    const opts = options.map(job => ({
      label: job,
      value: job,
    }));

    return opts.sort((a, b) => {
      const aSelected = selected.includes(a.value);
      const bSelected = selected.includes(b.value);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      return a.label.localeCompare(b.label);
    });
  });
}
