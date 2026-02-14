import { Component, ElementRef, ViewEncapsulation, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';

// Interface for filter options which can be passed to the filter component
export interface Filter {
  filterId: string;
  filterLabel: string;
  filterSearchPlaceholder: string;
  filterOptions: string[];
  shouldTranslateOptions?: boolean;
}

export interface FilterChange {
  filterId: string;
  selectedValues: string[];
}

@Component({
  selector: 'jhi-filter-multiselect',
  imports: [FormsModule, TranslateModule, DividerModule, CommonModule, FontAwesomeModule, CheckboxModule, ChipModule],
  templateUrl: './filter-multiselect.html',
  styleUrl: './filter-multiselect.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class FilterMultiselect {
  filterId = input.required<string>();
  filterLabel = input.required<string>();
  filterSearchPlaceholder = input.required<string>();
  filterOptions = input<string[]>([]);
  shouldTranslateOptions = input<boolean>(false);
  focusedIndexOptionList = signal<number>(-1);

  selectedValues = signal<string[]>([]);

  isOpen = signal(false);
  searchTerm = signal('');
  dropdownAlignment = signal<'left' | 'right'>('left');
  maxVisibleChips = 2;

  // gives the selected values back to the parent component
  filterChange = output<{ filterId: string; selectedValues: string[] }>();

  filteredOptions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const options = this.filterOptions();

    if (!search) {
      return options;
    }

    return options.filter(option => {
      if (this.shouldTranslateOptions()) {
        const translatedValue = this.translateService.instant(option).toLowerCase();
        return translatedValue.includes(search);
      } else {
        return option.toLowerCase().includes(search);
      }
    });
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
  private readonly translateService = inject(TranslateService);

  toggleDropdown(): void {
    this.isOpen.update(current => !current);
    if (this.isOpen()) {
      this.searchTerm.set('');
      this.calculateDropdownAlignment();
      this.focusedIndexOptionList.set(0);
    }
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();
    const maxIndex = options.length - 1;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();

        if (!this.isOpen()) {
          this.toggleDropdown();
          this.focusedIndexOptionList.set(0);
        } else if (this.focusedIndexOptionList() >= 0) {
          const option = options[this.focusedIndexOptionList()];
          this.toggleOption(option);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();

        if (!this.isOpen()) {
          this.toggleDropdown();
          this.focusedIndexOptionList.set(0);
        } else {
          const next = this.focusedIndexOptionList() < maxIndex ? this.focusedIndexOptionList() + 1 : 0; // wrap to top

          this.focusedIndexOptionList.set(next);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();

        if (this.isOpen()) {
          const prev = this.focusedIndexOptionList() > 0 ? this.focusedIndexOptionList() - 1 : maxIndex; // wrap to bottom

          this.focusedIndexOptionList.set(prev);
        }
        break;

      case 'Escape':
        if (this.isOpen()) {
          this.toggleDropdown();
          this.focusedIndexOptionList.set(-1);
        }
        break;
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  removeOption(value: string): void {
    this.toggleOption(value);
  }

  clearAll(): void {
    this.selectedValues.set([]); // if using signal
    this.emitChange(); // if needed
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
      filterId: this.filterId(),
      selectedValues: this.selectedValues(),
    });
  }

  private calculateDropdownAlignment(): void {
    setTimeout(() => {
      const dropdown = this.elementRef.nativeElement.querySelector('.filter-dropdown');
      if (dropdown && window.innerWidth <= 768) {
        const rect = dropdown.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        if (rect.right > viewportWidth) {
          this.dropdownAlignment.set('right');
        } else if (rect.left < 0) {
          this.dropdownAlignment.set('left');
        }
      } else {
        this.dropdownAlignment.set('left');
      }
    }, 0);
  }
}
