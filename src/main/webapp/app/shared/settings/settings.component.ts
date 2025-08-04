import { Component, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AccountService } from '../../core/auth/account.service';
import { UserShortDTO } from '../../generated';
import TranslateDirective from '../language/translate.directive';

import { EmailSettingsComponent } from './email-settings/email-settings.component';

@Component({
  selector: 'jhi-settings',
  imports: [FontAwesomeModule, TranslateDirective, EmailSettingsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly role = signal<UserShortDTO.RolesEnum | undefined>(undefined);
  private readonly accountService = inject(AccountService);

  constructor() {
    const authorities = this.accountService.user()?.authorities;
    this.role.set(authorities?.map(authority => authority as UserShortDTO.RolesEnum)[0]);
  }
}
