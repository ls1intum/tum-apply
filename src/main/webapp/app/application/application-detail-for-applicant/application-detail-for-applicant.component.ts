import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { ActionButton } from 'app/shared/components/atoms/button/button.types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DocumentViewerComponent } from 'app/shared/components/atoms/document-viewer/document-viewer.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PdfExportResourceApi } from 'app/generated/api/pdf-export-resource-api';
import { formatGradeDisplay, getApplicationPDFLabels } from 'app/shared/language/pdf-labels';
import { TranslateDirective } from 'app/shared/language';
import { JhiMenuItem, MenuComponent } from 'app/shared/components/atoms/menu/menu.component';
import { createMenuActionSignals } from 'app/shared/util/util';
import { ApplicationPDFRequest } from 'app/generated/model/application-pdf-request';
import { toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';

import * as DropDownOptions from '../../job/dropdown-options';
import { ApplicationResourceApi } from '../../generated/api/application-resource-api';
import { ApplicationDetailDTO } from '../../generated/model/application-detail-dto';
import { ApplicationDocumentIdsDTO } from '../../generated/model/application-document-ids-dto';
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
  showWithdrawDialog = signal(false);
  showDeleteDialog = signal(false);
  // preview application data passed from parent component (if any)
  previewDetailData = input<ApplicationDetailDTO | undefined>();
  previewDocumentData = input<ApplicationDocumentIdsDTO | undefined>();
  isSummaryPage = input<boolean>(false);

  applicationId = signal<string>('');

  private readonly detailResource = httpResource<ApplicationDetailDTO>(() => {
    const id = this.applicationId();
    return id ? `/api/applications/${encodeURIComponent(id)}/detail` : undefined;
  });
  private readonly documentIdsResource = httpResource<ApplicationDocumentIdsDTO>(() => {
    const id = this.applicationId();
    return id ? `/api/applications/getDocumentIds/${encodeURIComponent(id)}` : undefined;
  });

  application = computed(() => {
    const preview = this.previewDetailData();
    if (preview) return preview;

    return this.detailResource.value() ?? undefined;
  });
  documentIds = computed(() => {
    const preview = this.previewDocumentData();
    if (preview) return preview;

    return this.documentIdsResource.value() ?? undefined;
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
          this.onDownloadPDF();
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
          this.showWithdrawDialog.set(true);
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
          this.showDeleteDialog.set(true);
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
  private applicationApi = inject(ApplicationResourceApi);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private pdfExportApi = inject(PdfExportResourceApi);
  private translate = inject(TranslateService);

  private currentLang = toSignal(this.translate.onLangChange);

  private readonly translationKey = 'entity.toast.applyFlow';

  private detailErrorEffect = effect(() => {
    if (this.detailResource.error() && this.applicationId()) {
      this.toastService.showErrorKey(`${this.translationKey}.fetchApplicationFailed`);
    }
  });

  private documentIdsErrorEffect = effect(() => {
    if (this.documentIdsResource.error() && this.applicationId()) {
      this.toastService.showErrorKey(`${this.translationKey}.fetchDocumentIdsFailed`);
    }
  });

  constructor() {
    // Only initialize if we're on a detail page route (has application_id param)
    // and not in preview mode
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId !== null) {
      this.applicationId.set(applicationId);
    } else if (!this.previewDetailData()) {
      this.toastService.showErrorKey(`${this.translationKey}.invalidApplicationId`);
    }
  }

  onDownloadPDF(): void {
    const labels = getApplicationPDFLabels(this.translate);

    // Append grade display extra as the translation needs both limits as paramenters
    const applicant = this.application()?.applicant;
    labels.bachelorGradeDisplay = formatGradeDisplay(
      this.translate,
      applicant?.bachelorGrade,
      applicant?.bachelorGradeUpperLimit,
      applicant?.bachelorGradeLowerLimit,
    );
    labels.masterGradeDisplay = formatGradeDisplay(
      this.translate,
      applicant?.masterGrade,
      applicant?.masterGradeUpperLimit,
      applicant?.masterGradeLowerLimit,
    );

    const previewData = this.previewDetailData();
    const applicationData = previewData ?? this.detailResource.value();

    if (!applicationData) {
      return;
    }

    const req: ApplicationPDFRequest = {
      application: applicationData,
      labels,
    };

    this.pdfExportApi.exportApplicationToPDF(req).subscribe(response => {
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
      this.applicationApi.deleteApplication(applicationId).subscribe({
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
      this.applicationApi.withdrawApplication(applicationId).subscribe({
        next: () => {
          this.toastService.showSuccessKey(`${this.translationKey}.applicationWithdrawn`);
          // Refresh the application data to show updated state
          this.detailResource.reload();
          this.documentIdsResource.reload();
        },
        error: () => {
          this.toastService.showErrorKey(`${this.translationKey}.errorWithdrawingApplication`);
        },
      });
    }
  }
}
