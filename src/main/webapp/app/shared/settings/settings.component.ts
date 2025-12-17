import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { ThemeOption, ThemeService } from 'app/service/theme.service';
import { ToastService } from 'app/service/toast-service';
import { UserDataExportResourceApiService } from 'app/generated';
import { firstValueFrom } from 'rxjs';

import { SelectComponent, SelectOption } from '../components/atoms/select/select.component';
import TranslateDirective from '../language/translate.directive';
import { ButtonComponent } from '../components/atoms/button/button.component';

import { EmailSettingsComponent } from './email-settings/email-settings.component';

@Component({
  selector: 'jhi-settings',
  imports: [FontAwesomeModule, TranslateModule, TranslateDirective, EmailSettingsComponent, SelectComponent, ButtonComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnDestroy {
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

  exportCooldownRemaining = signal<number>(0); // seconds remaining for cooldown
  exportInProgress = signal<boolean>(false);
  exportButtonDisabled = computed(() => this.exportCooldownRemaining() > 0 || this.exportInProgress());

  protected readonly themeService = inject(ThemeService);
  protected readonly accountService = inject(AccountService);
  protected readonly userDataExportService = inject(UserDataExportResourceApiService);
  private readonly toastService = inject(ToastService);

  // Internal timer handle used for the cooldown interval
  private exportCooldownTimer: number | null = null;

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

  /**
   * Trigger user data export. Implementation mirrors the download approach used in
   * ApplicationDetailForApplicantComponent: read Content-Disposition header, extract
   * filename, create object URL for the blob, call `a.click()` and revoke the URL.
   */
  async exportUserData(): Promise<void> {
    if (this.exportButtonDisabled()) {
      return;
    }

    this.exportInProgress.set(true);

    try {
      const response = await firstValueFrom(this.userDataExportService.exportUserData('response'));

      const blob = response.body as Blob | undefined;
      if (blob && blob.size > 0) {
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `user-data-export-${new Date().toISOString()}.zip`;
        if (contentDisposition) {
          const match = /filename="([^\"]+)"/.exec(contentDisposition);
          if (match?.[1]) {
            filename = match[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        this.toastService.showSuccessKey('settings.privacy.export.started');

        const cooldownHeader = response.headers.get('X-Export-Cooldown') ?? response.headers.get('X-Cooldown-Seconds');
        const cooldownParsed = Number.parseInt(cooldownHeader ?? '', 10);
        const cooldown = Number.isFinite(cooldownParsed) && cooldownParsed > 0 ? cooldownParsed : 60;
        this.startExportCooldown(cooldown);
      } else {
        this.toastService.showErrorKey('settings.privacy.export.failed');
      }
    } catch {
      this.toastService.showErrorKey('settings.privacy.export.failed');
    } finally {
      this.exportInProgress.set(false);
    }
  }

  /**
   * Start an export cooldown to prevent spamming the export endpoint.
   * Implementation intentionally omitted — this is a design stub.
   * @param seconds cooldown duration in seconds
   */
  startExportCooldown(seconds: number): void {
    // Clear any existing timer
    if (this.exportCooldownTimer !== null) {
      clearInterval(this.exportCooldownTimer);
      this.exportCooldownTimer = null;
    }

    this.exportCooldownRemaining.set(seconds);

    // Use number type for window timer id
    this.exportCooldownTimer = window.setInterval(() => {
      const remaining = this.exportCooldownRemaining();
      if (remaining <= 1) {
        this.exportCooldownRemaining.set(0);
        if (this.exportCooldownTimer !== null) {
          clearInterval(this.exportCooldownTimer);
          this.exportCooldownTimer = null;
        }
      } else {
        this.exportCooldownRemaining.set(remaining - 1);
      }
    }, 1000) as unknown as number;
  }

  ngOnDestroy(): void {
    if (this.exportCooldownTimer !== null) {
      clearInterval(this.exportCooldownTimer);
      this.exportCooldownTimer = null;
    }
  }
}
