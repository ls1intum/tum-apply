import { Component, EventEmitter, Output, TemplateRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

export class TableColumn {
  field!: string;
  header!: string;
  type?: string;
  width!: string;
  alignCenter?: boolean;
  template?: TemplateRef<any>;
}

@Component({
  selector: 'jhi-dynamic-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
})
export class DynamicTableComponent {
  readonly paginator = true;
  readonly lazy = true;

  // ⚠️ Note the <>[] syntax and default []
  readonly columns = input<TableColumn[]>([]);
  readonly data = input<any[]>([]);
  readonly rows = input<number>(10);
  readonly totalRecords = input<number>(0);
  readonly loading = input<boolean>(false);
  readonly selectAble = input<boolean>(false);

  @Output() lazyLoad = new EventEmitter<TableLazyLoadEvent>();

  emitLazy(event: TableLazyLoadEvent): void {
    this.lazyLoad.emit(event);
  }
}
