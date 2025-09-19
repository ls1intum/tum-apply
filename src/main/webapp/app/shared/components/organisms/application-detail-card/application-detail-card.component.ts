import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';

import { ApplicationDetailDTO } from '../../../../generated/model/applicationDetailDTO';

@Component({
  selector: 'jhi-application-detail-card',
  imports: [SharedModule, FontAwesomeModule, NgTemplateOutlet, TranslateModule],
  templateUrl: './application-detail-card.component.html',
  styleUrl: './application-detail-card.component.scss',
})
export class ApplicationDetailCardComponent {
  application = input.required<ApplicationDetailDTO>();
}
