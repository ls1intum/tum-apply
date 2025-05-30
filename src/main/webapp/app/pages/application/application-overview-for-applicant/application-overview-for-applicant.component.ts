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

  readonly applicantId = '00000000-0000-0000-0000-000000000104';
  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly badgeTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');
  readonly createdTemplate = viewChild.required<TemplateRef<unknown>>('createdTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const actionTemplate = this.actionTemplate();
    const badgeTemplate = this.badgeTemplate();
    const createdTemplate = this.createdTemplate();
    return [
      { field: 'jobTitle', header: 'Position Title', width: '34rem' },
      { field: 'researchGroup', header: 'Research Group', width: '20rem' },
      { field: 'badges', header: 'Status', width: '10rem', template: badgeTemplate },
      { field: 'created', header: 'Created', width: '10rem', template: createdTemplate },
      { field: 'actions', header: '', width: '15rem', template: actionTemplate },
    ];
  });

  private readonly router = inject(Router);

  private readonly applicationService = inject(ApplicationResourceService);

  constructor() {
    effect(() => {
      this.applicationService.getApplicationPagesLength(this.applicantId).subscribe(val => this.total.set(val));
    });
  }

  async loadPage(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyLoadEvent.set(event);
    this.loading.set(true);

    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const page = first / rows;

    try {
      const res = await firstValueFrom(this.applicationService.getApplicationPages(this.applicantId, rows, page).pipe());

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

  calculateDate(createdDateString: string): string {
    const now = new Date();
    const createdDate = new Date(createdDateString);
    const seconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);

    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return 'just now';

    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

    const hours = Math.floor(seconds / 3600);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(seconds / 86400);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

    const weeks = Math.floor(seconds / 604800);
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;

    const months = Math.floor(seconds / 2592000); // 30 days
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

    const years = Math.floor(seconds / 31536000); // 365 days
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
}
