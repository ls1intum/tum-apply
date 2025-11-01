import { Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastService } from 'app/service/toast-service';
import SharedModule from 'app/shared/shared.module';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DocumentViewerComponent } from 'app/shared/components/atoms/document-viewer/document-viewer.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { TranslateModule } from '@ngx-translate/core';
import { facWithdraw } from 'app/shared/icons/icons';

import { ApplicationResourceApiService } from '../../generated/api/applicationResourceApi.service';
import { ApplicationDetailDTO } from '../../generated/model/applicationDetailDTO';
import { ApplicationDocumentIdsDTO } from '../../generated/model/applicationDocumentIdsDTO';
import { ApplicationStateForApplicantsComponent } from '../application-state-for-applicants/application-state-for-applicants.component';

@Component({
  selector: 'jhi-application-detail-for-applicant',
  imports: [
    SharedModule,
    ButtonComponent,
    FontAwesomeModule,
    ApplicationStateForApplicantsComponent,
    DocumentViewerComponent,
    ConfirmDialogModule,
    ConfirmDialog,
    TranslateModule,
  ],
  templateUrl: './application-detail-for-applicant.component.html',
  styleUrl: './application-detail-for-applicant.component.scss',
})
export default class ApplicationDetailForApplicantComponent {
  // preview application data passed from parent component (if any)
  previewDetailData = input<ApplicationDetailDTO | undefined>();
  previewDocumentData = input<ApplicationDocumentIdsDTO | undefined>();
  isSummaryPage = input<boolean>(false);

  // actual application data fetched from the backend
  actualDetailDataExists = signal<boolean>(false);
  actualDetailData = signal<ApplicationDetailDTO | null>(null);
  actualDocumentDataExists = signal<boolean>(false);
  actualDocumentData = signal<ApplicationDocumentIdsDTO | null>(null);

  applicationId = signal<string>('');

  application = computed(() => {
    const preview = this.previewDetailData();
    if (preview) return preview;

    return this.actualDetailDataExists() ? this.actualDetailData() : undefined;
  });
  documentIds = computed(() => {
    const preview = this.previewDocumentData();
    if (preview) return preview;

    return this.actualDocumentDataExists() ? this.actualDocumentData() : undefined;
  });

  private applicationService = inject(ApplicationResourceApiService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly translationKey = 'entity.toast.applyFlow';
  private readonly library = inject(FaIconLibrary);

  constructor() {
    // Register custom icons with FontAwesome library
    this.library.addIcons(facWithdraw);

    // Only initialize if we're on a detail page route (has application_id param)
    // and not in preview mode
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId !== null && !this.previewDetailData()) {
      void this.init();
    }
  }

  async init(): Promise<void> {
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId === null) {
      this.toastService.showErrorKey(`${this.translationKey}.invalidApplicationId`);
    } else {
      this.applicationId.set(applicationId);
    }

    try {
      const application = await firstValueFrom(this.applicationService.getApplicationForDetailPage(this.applicationId()));
      this.actualDetailData.set(application);
      this.actualDetailDataExists.set(true);
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.fetchApplicationFailed`);
    }

    try {
      const ids = await firstValueFrom(this.applicationService.getDocumentDictionaryIds(this.applicationId()));
      this.actualDocumentData.set(ids);
      this.actualDocumentDataExists.set(true);
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.fetchDocumentIdsFailed`);
    }
  }

  onUpdateApplication(): void {
    void this.router.navigate(['/application/form'], {
      queryParams: {
        application: this.applicationId(),
      },
    });
  }

  onViewJobDetails(): void {
    const jobIdValue = this.application()?.jobId;
    if (jobIdValue !== undefined && jobIdValue !== '') {
      void this.router.navigate(['/job/detail', jobIdValue]);
    } else {
      this.toastService.showErrorKey(`${this.translationKey}.jobIdNotAvailable`);
    }
  }

  onDeleteApplication(): void {
    const applicationId = this.applicationId();
    if (applicationId) {
      this.applicationService.deleteApplication(applicationId).subscribe({
        next: () => {
          this.toastService.showSuccessKey(`${this.translationKey}.applicationDeleted`);
          void this.router.navigate(['/application/overview']);
        },
        error: () => {
          this.toastService.showErrorKey(`${this.translationKey}.errorDeletingApplication`);
        },
      });
    }
  }

  onWithdrawApplication(): void {
    const applicationId = this.applicationId();
    if (applicationId) {
      this.applicationService.withdrawApplication(applicationId).subscribe({
        next: () => {
          this.toastService.showSuccessKey(`${this.translationKey}.applicationWithdrawn`);
          // Refresh the application data to show updated state
          void this.init();
        },
        error: () => {
          this.toastService.showErrorKey(`${this.translationKey}.errorWithdrawingApplication`);
        },
      });
    }
  }

  onBack(): void {
    this.location.back();
  }
}
