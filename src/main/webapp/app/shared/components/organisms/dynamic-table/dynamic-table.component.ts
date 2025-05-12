import { Component, EventEmitter, Input, Output, Signal, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'jhi-dynamic-table',
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
})
export class DynamicTableComponent {
  readonly paginator = true;
  readonly lazy = true;

  @Input({ required: true })
  columns: {
    field: string;
    header: string;
    type?: string;
    width: string;
    alignCenter?: boolean;
    template?: TemplateRef<any>;
  }[] = [];

  @Input() data: any[] = [];
  @Input() rows = 10;
  @Input() totalRecords = 0;
  @Input({ required: true }) loading!: Signal<boolean>;
  @Input() selectAble = false;

  @Output() lazyLoad = new EventEmitter<TableLazyLoadEvent>();

  emitLazy(event: TableLazyLoadEvent): void {
    this.lazyLoad.emit(event);
  }
}
