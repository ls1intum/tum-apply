import { Component } from '@angular/core';

import { RatingComponent } from '../../shared/components/atoms/rating/rating.component';
import { ApplicationCardComponent } from '../../shared/components/molecules/applicant-card/application-card.component';
import { ApplicationEvaluationOverviewDTO } from '../../generated';

@Component({
  selector: 'jhi-application-detail',
  imports: [RatingComponent, ApplicationCardComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  testApplications: ApplicationEvaluationOverviewDTO[] = [
    {
      applicationId: '00000000-0000-0000-0000-000000000001',
      avatar: undefined,
      name: 'Lukas Meier',
      state: 'SENT',
      jobName: 'AI Systems Research',
      rating: 2,
      appliedAt: '2025-05-28T14:32:00Z',
    },
    {
      applicationId: '00000000-0000-0000-0000-000000000002',
      avatar: undefined,
      name: 'Sophie Schneider',
      state: 'IN_REVIEW',
      jobName: 'Data Privacy and Ethics in Machine Learning',
      rating: -1,
      appliedAt: '2025-05-30T09:15:00Z',
    },
  ];
}
