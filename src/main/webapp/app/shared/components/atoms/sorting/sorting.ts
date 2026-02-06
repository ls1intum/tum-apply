import { Component, ViewEncapsulation, computed, inject, input, output, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SelectComponent, SelectOption } from '../select/select.component';
import { ButtonComponent } from '../button/button.component';

export interface SortOption {
  displayName: string;
  fieldName: string;
  type: 'TEXT' | 'NUMBER';
}

export interface Sort {
  field: string;
  direction: SortDirection;
}

export type SortDirection = 'ASC' | 'DESC';

@Component({
  selector: 'jhi-sorting',
  imports: [SelectComponent, ButtonComponent],
  templateUrl: './sorting.html',
  styleUrl: './sorting.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Sorting {
  sortableFields = input.required<SortOption[]>();

  isAsc = signal<boolean>(false);
  selectedOption = signal<SortOption | undefined>(undefined);

  sortChange = output<Sort>();

  readonly currentOption = computed(() => this.selectedOption() ?? this.sortableFields()[0]);

  readonly selectOptions = computed<SelectOption[]>(() =>
    this.sortableFields().map(opt => ({
      name: opt.displayName,
      value: opt.fieldName,
    })),
  );

  readonly selectedSelectOption = computed<SelectOption | undefined>(() => {
    const cur = this.currentOption();
    return { name: cur.displayName, value: cur.fieldName };
  });

  private translateService = inject(TranslateService);

  getSortIcon(): string {
    const type = this.currentOption().type;
    const asc = this.isAsc();

    if (type === 'NUMBER') {
      return asc ? 'arrow-up-9-1' : 'arrow-down-9-1';
    } else {
      return asc ? 'arrow-up-z-a' : 'arrow-down-z-a';
    }
  }

  getSortTooltip(): string {
    const type = this.currentOption().type;
    const asc = this.isAsc();

    if (type === 'NUMBER') {
      return asc
        ? this.translateService.instant('entity.sorting.ascending.number')
        : this.translateService.instant('entity.sorting.descending.number');
    } else {
      return asc
        ? this.translateService.instant('entity.sorting.ascending.text')
        : this.translateService.instant('entity.sorting.descending.text');
    }
  }

  onSortFieldChange(opt: SelectOption): void {
    if (opt.value === '') {
      this.selectedOption.set(undefined);
    } else {
      const match = this.sortableFields().find(so => so.fieldName === opt.value);
      this.selectedOption.set(match);
    }
    this.emitChange();
  }

  toggleDirection(): void {
    this.isAsc.update(v => !v);
    this.emitChange();
  }

  private emitChange(): void {
    const sel = this.currentOption();
    this.sortChange.emit({
      field: sel.fieldName,
      direction: this.isAsc() ? 'ASC' : 'DESC',
    });
  }
}
