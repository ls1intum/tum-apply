import { Component, ViewEncapsulation, computed, effect, input, model, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';

import { FilterSelectComponent } from '../../atoms/filter-select/filter-select.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import TranslateDirective from '../../../language/translate.directive';
import { FilterField, FilterOption } from '../../../filter';

@Component({
  selector: 'jhi-filter-dialog',
  imports: [DialogModule, DividerModule, ButtonComponent, FilterSelectComponent, TranslateModule, TranslateDirective],
  templateUrl: './filter-dialog.component.html',
  styleUrl: './filter-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FilterDialogComponent {
  filterFields = input.required<FilterField[]>();

  draftFields = signal<FilterField[]>([]);

  applyFilters = output<FilterField[]>();

  visible = model<boolean>(false);

  // Determines if "reset all" should be enabled (any filter active)
  canResetAll = computed(() => this.draftFields().some(f => f.selected.length));

  private _filterFields = signal<FilterField[]>([]);

  constructor() {
    // Keep internal copy of input filter fields for reference
    effect(() => {
      this._filterFields.set(this.filterFields());
    });

    // Clone filters to draft when dialog opens to avoid mutating input directly
    effect(() => {
      if (this.visible()) {
        this.draftFields.set(this._filterFields().map(f => new FilterField(f.translationKey, f.field, f.options, f.selected)));
      }
    });
  }

  // Clears selection for a single field
  resetField(field: FilterField): void {
    this.draftFields.update(list => list.map(f => (f.field === field.field ? f.resetSelection() : f)));
  }

  // Updates selection for a field
  onSelectionChange(field: FilterField, sel: FilterOption[]): void {
    this.draftFields.update(list => list.map(f => (f.field === field.field ? f.withSelection(sel) : f)));
  }

  // Commits draft filters and closes dialog
  applyAndClose(): void {
    this._filterFields.set(this.draftFields());
    this.applyFilters.emit(this._filterFields());
    this.visible.set(false);
  }

  // Clears all selections
  resetAll(): void {
    this.draftFields.update(list => list.map(f => f.resetSelection()));
  }
}
