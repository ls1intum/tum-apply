import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationOverviewDTO, ApplicationResourceService } from 'app/generated';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { ToastComponent } from 'app/shared/toast/toast.component';
import { ToastService } from 'app/service/toast-service';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { BadgeModule } from 'primeng/badge';
import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-application-overview-for-applicant',
  imports: [DynamicTableComponent, ButtonComponent, BadgeModule, SharedModule, TranslateModule, ToastComponent],
  templateUrl: './application-overview-for-applicant.component.html',
  styleUrl: './application-overview-for-applicant.component.scss',
})

/**
 *
 * This Angular component is responsible for displaying a paginated and dynamic overview
 * of applications submitted by the applicant. It uses a dynamic table
 * to list applications along with relevant details such as job title, research group,
 * application status, and creation time.
 */
export default class ApplicationOverviewForApplicantComponent {
  loading = signal(false);
  pageData = signal<ApplicationOverviewDTO[]>([]);
  pageSize = signal<number>(10);
  total = signal<number>(0);

  // Stores the last lazy load event to enable data refresh after actions
  lastLazyLoadEvent = signal<TableLazyLoadEvent | undefined>(undefined);

  // Template reference for action buttons (e.g., View, Withdraw, Delete)
  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');

  // Template reference for status badge display
  readonly badgeTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  // Computed table column definitions including custom templates
  readonly columns = computed<DynamicTableColumn[]>(() => {
    const actionTemplate = this.actionTemplate();
    const badgeTemplate = this.badgeTemplate();
    return [
      {
        field: 'jobTitle',
        header: 'entity.applicationOverview.columns.positionTitle',
        width: '34rem',
      },
      {
        field: 'researchGroup',
        header: 'entity.applicationOverview.columns.researchGroup',
        width: '20rem',
      },
      {
        field: 'badges',
        header: 'entity.applicationOverview.columns.status',
        width: '10rem',
        template: badgeTemplate,
      },
      {
        field: 'timeSinceCreation',
        header: 'entity.applicationOverview.columns.created',
        width: '10rem',
      },
      {
        field: 'actions',
        header: '',
        width: '15rem',
        template: actionTemplate,
      },
    ];
  });

  private readonly router = inject(Router);

  private readonly applicationService = inject(ApplicationResourceService);
  private readonly accountService = inject(AccountService);
  private readonly translate = inject(TranslateService);

  private applicantId = signal<string>('');

  constructor(private toastService: ToastService) {
    effect(() => {
      this.applicantId.set(this.accountService.loadedUser()?.id ?? '');
      this.loadTotal();
    });
  }

  async loadTotal(): Promise<void> {
    try {
      const tempTotal = await firstValueFrom(this.applicationService.getApplicationPagesLength(this.applicantId()));
      this.total.set(tempTotal);
    } catch (error) {
      console.error('Failed to load total application count', error);
    }
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
    this.router.navigate([`/application/detail/${applicationId}`]);
  }

  onUpdateApplication(applicationId: string): void {
    this.router.navigate([`/application/edit/${applicationId}`]);
  }

  onDeleteApplication(applicationId: string): void {
    // TODO nicer looking confirm, add dialog
    //if (confirmDelete) {
    this.applicationService.deleteApplication(applicationId).subscribe({
      next: () => {
        this.toastService.showSuccess({ detail: 'Application successfully deleted' });
        const event = this.lastLazyLoadEvent();
        if (event) this.loadPage(event);
      },
      error: err => {
        this.toastService.showError({ detail: 'Error withdrawing the application' });
        console.error('Delete failed', err);
      },
    });
    // }
  }

  onWithdrawApplication(applicationId: string): void {
    // TODO nicer looking confirm
    const confirmWithdraw = confirm('Do you really want to withdraw this application?');
    if (confirmWithdraw) {
      this.applicationService.withdrawApplication(applicationId).subscribe({
        next: () => {
          this.toastService.showSuccess({ detail: 'Application successfully withdrawn' });
          const event = this.lastLazyLoadEvent();
          if (event) this.loadPage(event);
        },
        error: err => {
          this.toastService.showError({ detail: 'Error withdrawing the application' });
          console.error('Withdraw failed', err);
        },
      });
    }
  }
}
