import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationDetailDTO, ApplicationResourceService } from 'app/generated';
import { ApplicationDetailCardComponent } from 'app/shared/components/organisms/application-detail-card/application-detail-card.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'jhi-application-detail-for-applicant',
  imports: [ApplicationDetailCardComponent],
  templateUrl: './application-detail-for-applicant.component.html',
  styleUrl: './application-detail-for-applicant.component.scss',
})
export default class ApplicationDetailForApplicantComponent {
  applicationId = signal<string>('');
  application = signal<ApplicationDetailDTO | undefined>(undefined);

  private applicationService = inject(ApplicationResourceService);
  private router = inject(Router);
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
  }
}
