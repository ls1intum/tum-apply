import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationDetailDTO } from 'app/generated';

@Component({
  selector: 'jhi-application-detail-card',
  imports: [FontAwesomeModule, NgTemplateOutlet],
  templateUrl: './application-detail-card.component.html',
  styleUrl: './application-detail-card.component.scss',
})
export class ApplicationDetailCardComponent {
  application = input.required<ApplicationDetailDTO>();
}
