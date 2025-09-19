import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeModule } from 'primeng/badge';

import { ApplicationDetailDTO } from '../../generated/model/applicationDetailDTO';

@Component({
  selector: 'jhi-application-state-for-applicants',
  imports: [BadgeModule, TranslateModule],
  templateUrl: './application-state-for-applicants.component.html',
  styleUrl: './application-state-for-applicants.component.scss',
})
export class ApplicationStateForApplicantsComponent {
  state = input.required<ApplicationDetailDTO.ApplicationStateEnum>();
}
