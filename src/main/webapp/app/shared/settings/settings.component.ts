import { Component, computed, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { ThemeOption, ThemeService } from 'app/service/theme.service';

import { SelectComponent, SelectOption } from '../components/atoms/select/select.component';
import TranslateDirective from '../language/translate.directive';

import { EmailSettingsComponent } from './email-settings/email-settings.component';

@Component({
  selector: 'jhi-settings',
  imports: [FontAwesomeModule, TranslateModule, TranslateDirective, EmailSettingsComponent, SelectComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly role = signal<UserShortDTO.RolesEnum | undefined>(undefined);

  themeOptions: SelectOption[] = [
    { name: 'settings.appearance.options.light', value: 'light' },
    { name: 'settings.appearance.options.dark', value: 'dark' },
    { name: 'settings.appearance.options.blossom', value: 'blossom' },
    { name: 'settings.appearance.options.aquabloom', value: 'aquabloom' },
    { name: 'settings.appearance.options.system', value: 'system' },
  ];

  selectedTheme = computed<SelectOption>(() => {
    const currentValue = this.themeService.syncWithSystem() ? 'system' : this.themeService.theme();
    return this.themeOptions.find(opt => opt.value === currentValue) ?? this.themeOptions[0];
  });

  protected readonly themeService = inject(ThemeService);
  protected readonly accountService = inject(AccountService);

  constructor() {
    const authorities = this.accountService.loadedUser()?.authorities;
    this.role.set(authorities?.map(authority => authority as UserShortDTO.RolesEnum)[0]);
  }

  onThemeChange(option: SelectOption): void {
    const value = option.value;

    if (value === 'system') {
      this.themeService.setSyncWithSystem(true);
    } else {
      this.themeService.setSyncWithSystem(false);
      this.themeService.setTheme(value as ThemeOption);
    }
  }
}
