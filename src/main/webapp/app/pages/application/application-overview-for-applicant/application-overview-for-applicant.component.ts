import { Component, computed, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { ApplicationOverviewDTO, ApplicationResourceService } from 'app/generated';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'jhi-application-overview-for-applicant',
  imports: [DynamicTableComponent, ButtonComponent],
  templateUrl: './application-overview-for-applicant.component.html',
  styleUrl: './application-overview-for-applicant.component.scss',
})
export default class ApplicationOverviewForApplicantComponent {
  readonly applicantId = '00000000-0000-0000-0000-000000000104';

  loading = signal(false);
  pageData = signal<ApplicationOverviewDTO[]>([]);
  pageSize = signal(10);
  total = signal(0);

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    return [
      { field: 'jobTitle', header: 'Position Title', width: '5rem' },
      { field: 'research_group', header: 'Research Group', width: '12rem' },
      { field: 'state', header: 'Status', width: '10rem', alignCenter: true },
      { field: 'submitted_since', header: 'Submitted', width: '26rem' },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  private readonly applicationService = inject(ApplicationResourceService);

  async loadPage(event: TableLazyLoadEvent): Promise<void> {
    this.loading.set(true);

    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const page = first / rows;

    try {
      const res = await firstValueFrom(this.applicationService.getApplicationPages(this.applicantId, rows, page).pipe());

      setTimeout(() => {
        // this.pageData.set(res.applications ?? []);
        // this.total.set(res.totalRecords ?? 0);
        this.pageData.set([...res]);
        this.total.set(res.length);
      });
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
