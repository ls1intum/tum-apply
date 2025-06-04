import { Component, input, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ApplicationEvaluationOverviewDTO } from '../../../../generated';
import { TagComponent } from '../../atoms/tag/tag.component';
import { RatingComponent } from '../../atoms/rating/rating.component';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-application-card',
  imports: [FontAwesomeModule, TagComponent, RatingComponent, ButtonComponent],
  templateUrl: './application-card.component.html',
  styleUrl: './application-card.component.scss',
})
export class ApplicationCardComponent {
  disabled = input<boolean>(false);
  application = input<ApplicationEvaluationOverviewDTO>();

  readonly stateTextMap = signal<Record<string, string>>({
    SENT: 'Unopened',
    ACCEPTED: 'Approved',
    REJECTED: 'Rejected',
    IN_REVIEW: 'In Review',
  });

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    IN_REVIEW: 'warn',
  });
}
