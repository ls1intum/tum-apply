import { Component, inject, signal } from '@angular/core';

import { DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { EmailTemplateResourceService } from '../../../generated';

@Component({
  selector: 'jhi-research-group-templates',
  imports: [DynamicTableComponent],
  templateUrl: './research-group-templates.html',
  styleUrl: './research-group-templates.scss',
})
export class ResearchGroupTemplates {
  protected pageNumber = signal<number>(0);
  protected pageSize = signal<number>(10);

  protected emailTemplateService = inject(EmailTemplateResourceService);

  protected readonly columns = [
    { field: 'templateName', header: 'templateName', width: '26rem' },
    { field: 'createdBy', header: 'createdBy', width: '10rem' },
    { field: '', header: '', width: '5rem' },
    { field: '', header: '', width: '5rem' },
  ];
}
