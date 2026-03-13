import { Component, TemplateRef, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TranslateDirective } from 'app/shared/language';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';

export class DynamicTableColumn {
  field!: string;
  header!: string;
  type?: string;
  width!: string;
  alignCenter?: boolean;
  template?: TemplateRef<unknown>;
}

@Component({
  selector: 'jhi-dynamic-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TranslateDirective, ProgressSpinnerComponent],
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
})
export class DynamicTableComponent {
  readonly paginator = true;
  readonly lazy = true;
  loading = input<boolean>(false);

  columns = input<DynamicTableColumn[]>([]);
  data = input<unknown[]>([]);
  rows = input<number>(10);
  totalRecords = input<number>(0);
  page = input<number>(0);
  selectable = input<boolean>(false);
  hideHeader = input<boolean>(false);

  lazyLoad = output<TableLazyLoadEvent>();

  emitLazy(event: TableLazyLoadEvent): void {
    this.lazyLoad.emit(event);
  }
}
