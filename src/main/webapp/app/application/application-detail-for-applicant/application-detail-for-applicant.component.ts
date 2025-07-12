import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApplicationDetailDTO, ApplicationDocumentIdsDTO, ApplicationResourceService } from 'app/generated';
import DocumentGroupComponent from 'app/shared/components/molecules/document-group/document-group.component';
import { ApplicationDetailCardComponent } from 'app/shared/components/organisms/application-detail-card/application-detail-card.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'jhi-application-detail-for-applicant',
  imports: [ApplicationDetailCardComponent, DocumentGroupComponent],
  templateUrl: './application-detail-for-applicant.component.html',
  styleUrl: './application-detail-for-applicant.component.scss',
})
export default class ApplicationDetailForApplicantComponent {
  applicationId = signal<string>('');
  application = signal<ApplicationDetailDTO | undefined>(undefined);
  documentIds = signal<ApplicationDocumentIdsDTO | undefined>(undefined);

  private applicationService = inject(ApplicationResourceService);
  private route = inject(ActivatedRoute);

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId === null) {
      alert('Error: this is no valid jobId');
    } else {
      this.applicationId.set(applicationId);
    }
    const application = await firstValueFrom(this.applicationService.getApplicationForDetailPage(this.applicationId()));
    this.application.set(application);

    firstValueFrom(this.applicationService.getDocumentDictionaryIds(this.applicationId()))
      .then(ids => {
        this.documentIds.set(ids);
      })
      .catch(() => alert('Error: fetching the document ids for this application'));
  }
}
