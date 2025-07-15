import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AccountService } from '../../core/auth/account.service';
import { UserShortDTO } from '../../generated';
import TranslateDirective from '../language/translate.directive';

import { ProfessorNotificationsComponent } from './notifications/professor-notifications/professor-notifications.component';
import { ApplicantNotificationsComponent } from './notifications/applicant-notifications/applicant-notifications.component';

@Component({
  selector: 'jhi-settings',
  imports: [FontAwesomeModule, TranslateDirective, ProfessorNotificationsComponent, ApplicantNotificationsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly role;
  private readonly accountService = inject(AccountService);

  constructor() {
    const authorities = this.accountService.user()?.authorities;
    this.role = authorities?.map(authority => authority as UserShortDTO.RolesEnum)[0];
  }
}
