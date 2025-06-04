import { Component, input } from '@angular/core';
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
  application = input<ApplicationEvaluationOverviewDTO>;
}
