import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { ActionButton } from 'app/shared/components/atoms/button/button.types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DocumentViewerComponent } from 'app/shared/components/atoms/document-viewer/document-viewer.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PdfExportResourceApiService } from 'app/generated/api/pdfExportResourceApi.service';
import { formatGradeDisplay, getApplicationPDFLabels } from 'app/shared/language/pdf-labels';
import { TranslateDirective } from 'app/shared/language';
import { JhiMenuItem, MenuComponent } from 'app/shared/components/atoms/menu/menu.component';
import { createMenuActionSignals } from 'app/shared/util/util';
import { ApplicationPDFRequest } from 'app/generated';
import { toSignal } from '@angular/core/rxjs-interop';

import * as DropDownOptions from '../../job/dropdown-options';
import { ApplicationResourceApiService } from '../../generated/api/applicationResourceApi.service';
import { ApplicationDetailDTO } from '../../generated/model/applicationDetailDTO';
import { ApplicationDocumentIdsDTO } from '../../generated/model/applicationDocumentIdsDTO';
import { ApplicationStateForApplicantsComponent } from '../application-state-for-applicants/application-state-for-applicants.component';
import LocalizedDatePipe from '../../shared/pipes/localized-date.pipe';

@Component({
  selector: 'jhi-application-detail-for-applicant',
  imports: [
    ButtonComponent,
    BackButtonComponent,
    FontAwesomeModule,
    ApplicationStateForApplicantsComponent,
    DocumentViewerComponent,
    ConfirmDialogModule,
    ConfirmDialog,
    TranslateModule,
    TranslateDirective,
    LocalizedDatePipe,
    MenuComponent,
  ],
  templateUrl: './application-detail-for-applicant.component.html',
  styleUrl: './application-detail-for-applicant.component.scss',
})
export default class ApplicationDetailForApplicantComponent {
  withdrawConfirmDialog = viewChild<ConfirmDialog>('withdrawConfirmDialog');
  deleteConfirmDialog = viewChild<ConfirmDialog>('deleteConfirmDialog');
  // preview application data passed from parent component (if any)
  previewDetailData = input<ApplicationDetailDTO | undefined>();
  previewDocumentData = input<ApplicationDocumentIdsDTO | undefined>();
  isSummaryPage = input<boolean>(false);

  // actual application data fetched from the server
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

  readonly primaryActionButton = computed<ActionButton | null>(() => {
    const app = this.application();
    if (!app) return null;

    // Edit button for SAVED state
    if (['SAVED'].includes(app.applicationState)) {
      return {
        label: 'button.edit',
        icon: 'pencil',
        severity: 'primary',
        onClick: () => {
          this.onUpdateApplication();
        },
      };
    }

    return null;
  });

  readonly menuItems = computed<JhiMenuItem[]>(() => {
    const app = this.application();
    const items: JhiMenuItem[] = [];

    if (!app) return items;

    // Always add PDF download option
    if (!this.previewDetailData()) {
      items.push({
        label: 'button.downloadPDF',
        icon: 'file-pdf',
        severity: 'primary',
        command: () => {
          void this.onDownloadPDF();
        },
      });
    }

    // Add Withdraw button for SENT/IN_REVIEW states
    if (['SENT', 'IN_REVIEW'].includes(app.applicationState)) {
      items.push({
        label: 'button.withdraw',
        icon: 'withdraw',
        severity: 'danger',
        command: () => {
          this.withdrawConfirmDialog()?.confirm();
        },
      });
    }

    // Add Delete button for SAVED state
    if (['SAVED'].includes(app.applicationState)) {
      items.push({
        label: 'button.delete',
        icon: 'trash',
        severity: 'danger',
        command: () => {
          this.deleteConfirmDialog()?.confirm();
        },
      });
    }

    return items;
  });

  // Menu action signals - determines when to show kebab menu vs individual buttons
  readonly menuActionSignals = createMenuActionSignals({
    hasPrimaryButton: computed(() => !!this.primaryActionButton()),
    menuItems: this.menuItems,
  });

  readonly shouldShowKebabMenu = this.menuActionSignals.shouldShowKebabMenu;
  readonly individualActionButtons = this.menuActionSignals.individualActionButtons;

  readonly showPdfButtonForPreview = computed<boolean>(() => {
    return !!this.previewDetailData();
  });

  bachelorGradeDisplay = computed(() => {
    this.currentLang();
    const applicant = this.application()?.applicant;
    const grade = applicant?.bachelorGrade;
    if (!grade) return '-';

    const limits = { upperLimit: applicant.bachelorGradeUpperLimit, lowerLimit: applicant.bachelorGradeLowerLimit };
    if (!limits.upperLimit || !limits.lowerLimit) return grade;

    const scale =
      '(' +
      (this.translate.instant('entity.applicationPage2.helperText.gradingScale', {
        upperLimit: limits.upperLimit,
        lowerLimit: limits.lowerLimit,
      }) as string) +
      ')';

    return `${grade} ${scale}`;
  });

  masterGradeDisplay = computed(() => {
    this.currentLang();
    const applicant = this.application()?.applicant;
    const grade = applicant?.masterGrade;
    if (!grade) return '-';

    const limits = { upperLimit: applicant.masterGradeUpperLimit, lowerLimit: applicant.masterGradeLowerLimit };
    if (!limits.upperLimit || !limits.lowerLimit) return grade;

    const scale =
      '(' +
      (this.translate.instant('entity.applicationPage2.helperText.gradingScale', {
        upperLimit: limits.upperLimit,
        lowerLimit: limits.lowerLimit,
      }) as string) +
      ')';

    return `${grade} ${scale}`;
  });

  readonly dropDownOptions = DropDownOptions;
  private applicationService = inject(ApplicationResourceApiService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private pdfExportService = inject(PdfExportResourceApiService);
  private translate = inject(TranslateService);

  private currentLang = toSignal(this.translate.onLangChange);

  private readonly translationKey = 'entity.toast.applyFlow';

  constructor() {
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

  async onDownloadPDF(): Promise<void> {
    let req: ApplicationPDFRequest;
    const labels = getApplicationPDFLabels(this.translate);

    // Append grade display extra as the translation needs both limits as paramenters
    const applicant = this.application()?.applicant;
    labels['bachelorGradeDisplay'] = formatGradeDisplay(
      this.translate,
      applicant?.bachelorGrade,
      applicant?.bachelorGradeUpperLimit,
      applicant?.bachelorGradeLowerLimit,
    );
    labels['masterGradeDisplay'] = formatGradeDisplay(
      this.translate,
      applicant?.masterGrade,
      applicant?.masterGradeUpperLimit,
      applicant?.masterGradeLowerLimit,
    );

    const previewData = this.previewDetailData();

    if (previewData) {
      req = {
        application: previewData,
        labels,
      };
    } else {
      const applicationId = this.applicationId();
      const application = await firstValueFrom(this.applicationService.getApplicationForDetailPage(applicationId));
      req = {
        application,
        labels,
      };
    }

    this.pdfExportService.exportApplicationToPDF(req, 'response').subscribe(response => {
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'application.pdf';

      if (contentDisposition !== null) {
        const match = /filename="([^"]+)"/.exec(contentDisposition);
        filename = match?.[1] ?? 'application.pdf';
      }

      const blob = response.body;
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
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
}
