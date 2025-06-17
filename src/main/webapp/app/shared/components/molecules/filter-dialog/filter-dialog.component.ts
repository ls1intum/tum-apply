import { Component, OnInit, ViewEncapsulation, computed, effect, input, model, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';

import { FilterOption, FilterSelectComponent } from '../../atoms/filter-select/filter-select.component';
import { ButtonComponent } from '../../atoms/button/button.component';

export interface FilterField {
  displayName: string;
  field: string;
  options: FilterOption[];
  selected?: FilterOption[];
}

@Component({
  selector: 'jhi-filter-dialog',
  imports: [DialogModule, DividerModule, ButtonComponent, FilterSelectComponent],
  templateUrl: './filter-dialog.component.html',
  styleUrl: './filter-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FilterDialogComponent implements OnInit {
  filterFields = input.required<FilterField[]>();

  draftFields = signal<FilterField[]>([]);

  applyFilters = output<Record<string, FilterOption[]>>();

  visible = model<boolean>(false);

  canResetAll = computed(() => this.draftFields().some(f => f.selected?.length));

  private _filterFields = signal<FilterField[]>([]);

  constructor() {
    // whenever the dialog opens, clone the incoming fields
    effect(() => {
      if (this.visible()) {
        this.draftFields.set(
          this._filterFields().map(f => ({
            ...f,
            selected: f.selected ? [...f.selected] : [],
          })),
        );
      }
    });
  }

  ngOnInit(): void {
    this._filterFields.set(this.filterFields());
  }

  resetField(field: FilterField): void {
    this.draftFields.update(list =>
      list.map(f =>
        f.field === field.field
          ? { ...f, selected: [] } // replace object reference
          : f,
      ),
    );
  }

  onSelectionChange(field: FilterField, sel: FilterOption[]): void {
    this.draftFields.update(list =>
      list.map(f =>
        f.field === field.field
          ? { ...f, selected: sel } // replace object reference
          : f,
      ),
    );
  }

  applyAndClose(): void {
    this._filterFields.set(this.draftFields());
    const result = Object.fromEntries(this.draftFields().map(f => [f.field, f.selected ?? []]));
    this.applyFilters.emit(result);
    this.visible.set(false);
  }

  resetAll(): void {
    this.draftFields.update(list => list.map(f => ({ ...f, selected: [] })));
  }
}
