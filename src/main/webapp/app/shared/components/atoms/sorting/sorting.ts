import { Component, ViewEncapsulation, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import TranslateDirective from 'app/shared/language/translate.directive';

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

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

@Component({
  selector: 'jhi-sorting',
  imports: [SelectComponent, ButtonComponent, TranslateModule, TranslateDirective],
  templateUrl: './sorting.html',
  styleUrl: './sorting.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Sorting {
  // input of the sortable fields
  sortableFields = input.required<SortOption[]>();

  isAsc = signal<boolean>(false);
  selectedOption = signal<SortOption | undefined>(undefined);

  // output of the selected sort option
  sortChange = output<Sort>();

  // currently selected option, defaults to the first option if none is selected
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

  getSortIcon(): string {
    const type = this.currentOption().type;
    const asc = this.isAsc();

    if (type === 'NUMBER') {
      return asc ? 'arrow-down-1-9' : 'arrow-up-1-9';
    } else {
      return asc ? 'arrow-down-a-z' : 'arrow-up-a-z';
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
      direction: this.isAsc() ? SortDirection.ASC : SortDirection.DESC,
    });
  }
}
