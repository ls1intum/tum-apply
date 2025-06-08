import { Component, OnInit, inject, signal } from '@angular/core';

import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../generated';
import { ApplicationCarouselComponent } from '../../shared/components/organisms/application-carousel/application-carousel.component';

@Component({
  selector: 'jhi-application-detail',
  imports: [ApplicationCarouselComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent implements OnInit {
  applicationsOverview = signal<ApplicationEvaluationOverviewDTO[] | null>(null);

  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  private readonly evaluationService = inject(ApplicationEvaluationResourceService);
}
