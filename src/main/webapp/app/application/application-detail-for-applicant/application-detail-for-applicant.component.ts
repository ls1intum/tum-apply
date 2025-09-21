import { Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import DocumentGroupComponent from 'app/shared/components/molecules/document-group/document-group.component';
import { ApplicationDetailCardComponent } from 'app/shared/components/organisms/application-detail-card/application-detail-card.component';
import { ToastService } from 'app/service/toast-service';
import SharedModule from 'app/shared/shared.module';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { ApplicationStateForApplicantsComponent } from '../application-state-for-applicants/application-state-for-applicants.component';
import { ApplicationResourceApiService } from '../../generated/api/applicationResourceApi.service';
import { ApplicationDetailDTO } from '../../generated/model/applicationDetailDTO';
import { ApplicationDocumentIdsDTO } from '../../generated/model/applicationDocumentIdsDTO';

@Component({
  selector: 'jhi-application-detail-for-applicant',
  imports: [ApplicationDetailCardComponent, DocumentGroupComponent, SharedModule, ApplicationStateForApplicantsComponent, ButtonComponent],
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

  constructor() {
    // Only initialize if we're on a detail page route (has application_id param)
    // and not in preview mode
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId && !this.previewDetailData()) {
      this.init();
    }
  }

  async init(): Promise<void> {
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId === null) {
      this.toastService.showErrorKey('entity.toast.applyFlow.invalidApplicationId');
    } else {
      this.applicationId.set(applicationId);
    }

    const application = await firstValueFrom(this.applicationService.getApplicationForDetailPage(this.applicationId()));
    this.actualDetailData.set(application);
    this.actualDetailDataExists.set(true);

    firstValueFrom(this.applicationService.getDocumentDictionaryIds(this.applicationId()))
      .then(ids => {
        this.actualDocumentData.set(ids);
        this.actualDocumentDataExists.set(true);
      })
      .catch(() => this.toastService.showErrorKey('entity.toast.applyFlow.fetchDocumentIdsFailed'));
  }

  onUpdateApplication(): void {
    this.router.navigate(['/application/form'], {
      queryParams: {
        application: this.applicationId(),
      },
    });
  }
}
