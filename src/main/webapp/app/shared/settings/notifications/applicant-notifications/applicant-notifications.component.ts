import { Component, ViewEncapsulation } from '@angular/core';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'jhi-applicant-notifications',
  imports: [DividerModule, ToggleSwitchModule],
  templateUrl: './applicant-notifications.component.html',
  styleUrl: './applicant-notifications.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ApplicantNotificationsComponent {}
