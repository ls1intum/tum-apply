import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationDetailDTO, ApplicationDocumentIdsDTO, ApplicationResourceService } from 'app/generated';
import DocumentGroupComponent from 'app/shared/components/molecules/document-group/document-group.component';
import { ApplicationDetailCardComponent } from 'app/shared/components/organisms/application-detail-card/application-detail-card.component';
import { ToastService } from 'app/service/toast-service';
import SharedModule from 'app/shared/shared.module';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

import { ApplicationStateForApplicantsComponent } from '../application-state-for-applicants/application-state-for-applicants.component';

@Component({
  selector: 'jhi-application-detail-for-applicant',
  imports: [ApplicationDetailCardComponent, DocumentGroupComponent, SharedModule, ApplicationStateForApplicantsComponent, ButtonComponent],
  templateUrl: './application-detail-for-applicant.component.html',
  styleUrl: './application-detail-for-applicant.component.scss',
})
export default class ApplicationDetailForApplicantComponent {
  applicationId = signal<string>('');
  application = signal<ApplicationDetailDTO | undefined>(undefined);
  documentIds = signal<ApplicationDocumentIdsDTO | undefined>(undefined);

  private applicationService = inject(ApplicationResourceService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private readonly router = inject(Router);

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId === null) {
      this.toastService.showErrorKey('entity.toast.applyFlow.invalidApplicationId');
    } else {
      this.applicationId.set(applicationId);
    }
    const application = await firstValueFrom(this.applicationService.getApplicationForDetailPage(this.applicationId()));
    this.application.set(application);

    firstValueFrom(this.applicationService.getDocumentDictionaryIds(this.applicationId()))
      .then(ids => {
        this.documentIds.set(ids);
      })
      .catch(() => this.toastService.showErrorKey('entity.toast.applyFlow.fetchDocumentIdsFailed'));
  }

  onUpdateApplication(): void {
    this.router.navigate([`/application/edit/${this.applicationId()}`]);
  }
}
