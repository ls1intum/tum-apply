import { Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';
import { ApplicationDetailDTO } from 'app/generated/model/applicationDetailDTO';

import { TagComponent } from '../../atoms/tag/tag.component';
import { RatingComponent } from '../../atoms/rating/rating.component';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'jhi-application-card',
  imports: [FontAwesomeModule, TagComponent, RatingComponent, ButtonComponent, TranslateModule],
  templateUrl: './application-card.component.html',
  styleUrl: './application-card.component.scss',
})
export class ApplicationCardComponent {
  disabled = input<boolean>(false);
  placeholder = input<boolean>(false);
  application = input<ApplicationEvaluationDetailDTO | undefined>(undefined);

  readonly applicationDetails = computed<ApplicationDetailDTO | undefined>(() => {
    const application = this.application();
    if (application) {
      return application.applicationDetailDTO;
    }
    return undefined;
  });

  readonly isDisabled = computed(
    () =>
      this.disabled() ||
      this.applicationDetails()?.applicationState === 'ACCEPTED' ||
      this.applicationDetails()?.applicationState === 'REJECTED',
  );

  readonly stateTextMap: Record<string, string> = {
    SENT: 'evaluation.statusBadge.SENT',
    ACCEPTED: 'evaluation.statusBadge.ACCEPTED',
    REJECTED: 'evaluation.statusBadge.REJECTED',
    IN_REVIEW: 'evaluation.statusBadge.IN_REVIEW',
  };

  readonly stateSeverityMap: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
    SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    IN_REVIEW: 'warn',
  };
}
