import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationDetailDTO } from 'app/generated';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'jhi-application-state-for-applicants',
  imports: [BadgeModule, TranslateModule],
  templateUrl: './application-state-for-applicants.component.html',
  styleUrl: './application-state-for-applicants.component.scss',
})
export class ApplicationStateForApplicantsComponent {
  state = input.required<ApplicationDetailDTO.ApplicationStateEnum>();
}
