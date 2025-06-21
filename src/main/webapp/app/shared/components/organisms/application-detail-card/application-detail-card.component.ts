import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationDetailDTO } from 'app/generated';
import SharedModule from 'app/shared/shared.module';

@Component({
  selector: 'jhi-application-detail-card',
  imports: [SharedModule, FontAwesomeModule, NgTemplateOutlet],
  templateUrl: './application-detail-card.component.html',
  styleUrl: './application-detail-card.component.scss',
})
export class ApplicationDetailCardComponent {
  application = input.required<ApplicationDetailDTO>();
}
