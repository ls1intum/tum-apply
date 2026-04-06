import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationDetailDTOApplicationStateEnum } from 'app/generated/model/application-detail-dto';

import { TagComponent } from '../../shared/components/atoms/tag/tag.component';

@Component({
  selector: 'jhi-application-state-for-applicants',
  imports: [TagComponent, TranslateModule],
  templateUrl: './application-state-for-applicants.component.html',
  styleUrl: './application-state-for-applicants.component.scss',
})
export class ApplicationStateForApplicantsComponent {
  readonly AppState = ApplicationDetailDTOApplicationStateEnum;

  state = input.required<ApplicationDetailDTOApplicationStateEnum>();
}
