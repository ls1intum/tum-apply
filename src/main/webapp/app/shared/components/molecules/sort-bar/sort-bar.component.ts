import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { DropdownComponent, DropdownOption } from '../../atoms/dropdown/dropdown.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';

export interface SortOption {
  displayName: string;
  field: string;
  type: 'TEXT' | 'NUMBER';
}

export interface Sort {
  field?: string;
  direction: SortDirection;
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

@Component({
  selector: 'jhi-sort-bar',
  imports: [CommonModule, DropdownComponent, ButtonComponent, FontAwesomeModule, TranslateModule, TranslateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sort-bar.component.html',
  styleUrls: ['./sort-bar.component.scss'],
  standalone: true,
})
export class SortBarComponent {
  totalRecords = input.required<number>();
  sortableFields = input.required<SortOption[]>();

  // translation keys used for the total number of records found
  // those fields should already be translated within the parent component
  singleEntity = input.required<string>();
  multipleEntities = input.required<string>();

  sortChange = output<Sort>();

  selectedOption = signal<SortOption | undefined>(undefined);
  isAsc = signal<boolean>(false);

  readonly currentOption = computed(() => this.selectedOption() ?? this.sortableFields()[0]);

  readonly dropdownOptions = computed<DropdownOption[]>(() =>
    this.sortableFields().map(opt => ({
      name: opt.displayName,
      value: opt.field,
    })),
  );

  readonly selectedDropdownOption = computed<DropdownOption | undefined>(() => {
    const cur = this.currentOption();
    return { name: cur.displayName, value: cur.field };
  });

  onSortFieldChange(opt: DropdownOption): void {
    if (opt.value === '') {
      this.selectedOption.set(undefined);
    } else {
      const match = this.sortableFields().find(so => so.field === opt.value);
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
      field: sel.field,
      direction: this.isAsc() ? SortDirection.ASC : SortDirection.DESC,
    });
  }
}
