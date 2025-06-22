import { Component, signal } from '@angular/core';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';

import { ApplicationCarouselComponent } from '../../shared/components/organisms/application-carousel/application-carousel.component';
import { ApplicationDetailCardComponent } from '../../shared/components/organisms/application-detail-card/application-detail-card.component';
import { RatingComponent } from '../../shared/components/atoms/rating/rating.component';

@Component({
  selector: 'jhi-application-detail',
  imports: [ApplicationCarouselComponent, ApplicationDetailCardComponent, RatingComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  application = signal<ApplicationEvaluationDetailDTO | undefined>(undefined);

  onApplicationChange(event: ApplicationEvaluationDetailDTO) {
    this.application.set(event);
  }
}
