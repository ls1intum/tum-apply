import { Component, ElementRef, ViewEncapsulation, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CheckboxModule } from 'primeng/checkbox';

// Interface for filter options which can be passed to the filter component
export interface Filter {
  filterLabel: string;
  filterSearchPlaceholder: string;
  filterOptions: string[];
  shouldTranslateOptions?: boolean;
}

export interface FilterChange {
  filterLabel: string;
  selectedValues: string[];
}

@Component({
  selector: 'jhi-filter-multiselect',
  imports: [FormsModule, TranslateModule, DividerModule, CommonModule, FontAwesomeModule, CheckboxModule],
  templateUrl: './filter-multiselect.html',
  styleUrl: './filter-multiselect.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class FilterMultiselect {
  filterLabel = input.required<string>();
  filterSearchPlaceholder = input.required<string>();
  filterOptions = input<string[]>([]);
  shouldTranslateOptions = input<boolean>(false);

  selectedValues = signal<string[]>([]);

  isOpen = signal(false);
  searchTerm = signal('');

  // gives the selected values back to the parent component
  filterChange = output<{ filterLabel: string; selectedValues: string[] }>();

  filteredOptions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const options = this.filterOptions();

    return options.filter(option => option.toLowerCase().includes(search));
  });

  sortedOptions = computed(() => {
    const selected = this.selectedValues();
    const filtered = this.filteredOptions();

    const opts = filtered.map(job => ({
      label: job,
      value: job,
      selected: selected.includes(job),
    }));

    return opts.sort((a, b) => {
      if (a.selected && !b.selected) return -1;
      if (!a.selected && b.selected) return 1;

      return a.label.localeCompare(b.label);
    });
  });

  selectedOptions = computed(() => this.sortedOptions().filter(opt => opt.selected));

  unselectedOptions = computed(() => this.sortedOptions().filter(opt => !opt.selected));

  hasSelectedItems = computed(() => this.selectedOptions().length > 0);
  hasUnselectedItems = computed(() => this.unselectedOptions().length > 0);

  selectedCount = computed(() => this.selectedValues().length);
  totalCount = computed(() => this.filterOptions().length);

  private readonly elementRef = inject(ElementRef);

  toggleDropdown(): void {
    this.isOpen.update(current => !current);
    if (this.isOpen()) {
      this.searchTerm.set('');
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  toggleOption(option: string): void {
    const currentSelected = this.selectedValues();
    const isSelected = currentSelected.includes(option);

    if (isSelected) {
      this.selectedValues.set(currentSelected.filter(val => val !== option));
    } else {
      this.selectedValues.set([...currentSelected, option]);
    }

    this.emitChange();
  }

  onSearchChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.searchTerm.set(target.value);
    }
  }

  // Close dropdown when clicking outside
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  private emitChange(): void {
    this.filterChange.emit({
      filterLabel: this.filterLabel(),
      selectedValues: this.selectedValues(),
    });
  }
}
