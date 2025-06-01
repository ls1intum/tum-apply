import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationOverviewDTO, ApplicationResourceService } from 'app/generated';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'jhi-application-overview-for-applicant',
  imports: [DynamicTableComponent, ButtonComponent, BadgeModule],
  templateUrl: './application-overview-for-applicant.component.html',
  styleUrl: './application-overview-for-applicant.component.scss',
})
export default class ApplicationOverviewForApplicantComponent {
  loading = signal(false);
  pageData = signal<ApplicationOverviewDTO[]>([]);
  pageSize = signal<number>(10);
  total = signal<number>(0);

  lastLazyLoadEvent = signal<TableLazyLoadEvent | undefined>(undefined);

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly badgeTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const actionTemplate = this.actionTemplate();
    const badgeTemplate = this.badgeTemplate();
    return [
      { field: 'jobTitle', header: 'Position Title', width: '34rem' },
      { field: 'researchGroup', header: 'Research Group', width: '20rem' },
      { field: 'badges', header: 'Status', width: '10rem', template: badgeTemplate },
      { field: 'timeSinceCreation', header: 'Created', width: '10rem' },
      { field: 'actions', header: '', width: '15rem', template: actionTemplate },
    ];
  });

  private readonly router = inject(Router);

  private readonly applicationService = inject(ApplicationResourceService);

  constructor() {
    effect(() => {
      this.applicationService.getApplicationPagesLength().subscribe(val => this.total.set(val));
    });
  }

  async loadPage(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyLoadEvent.set(event);
    this.loading.set(true);

    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const page = first / rows;

    try {
      const res = await firstValueFrom(this.applicationService.getApplicationPages(rows, page).pipe());

      setTimeout(() => {
        this.pageData.set(res);
      });
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onViewApplication(applicationId: string): void {
    this.router.navigate([`/application/edit/${applicationId}`]);
  }

  onDeleteApplication(applicationId: string): void {
    // TODO nicer looking confirm
    const confirmDelete = confirm('Do you really want to delete this application?');
    if (confirmDelete) {
      this.applicationService.deleteApplication(applicationId).subscribe({
        next: () => {
          alert('Application successfully deleted');
          const event = this.lastLazyLoadEvent();
          if (event) this.loadPage(event);
        },
        error(err) {
          alert('Error withdrawing the application');
          console.error('Delete failed', err);
        },
      });
    }
  }

  onWithdrawApplication(applicationId: string): void {
    // TODO nicer looking confirm
    const confirmWithdraw = confirm('Do you really want to withdraw this application?');
    if (confirmWithdraw) {
      this.applicationService.withdrawApplication(applicationId).subscribe({
        next: () => {
          alert('Application successfully withdrawn');
          const event = this.lastLazyLoadEvent();
          if (event) this.loadPage(event);
        },
        error(err) {
          alert('Error withdrawing the application');
          console.error('Withdraw failed', err);
        },
      });
    }
  }
}
