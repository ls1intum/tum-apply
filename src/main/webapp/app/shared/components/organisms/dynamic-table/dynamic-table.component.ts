import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'jhi-dynamic-table',
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
})
export class DynamicTableComponent {
  @Input() data: any[] = [];
  @Input() columns: {
    field: string;
    header: string;
    width: string;
    alignCenter?: boolean;
    template?: TemplateRef<any>;
  }[] = [];
  @Input() paginator = true;
  @Input() rows = 10;
  @Input() selectAble = false;
}
