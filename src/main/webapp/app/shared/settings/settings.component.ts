import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { ThemeOption, ThemeService } from 'app/service/theme.service';
import { ToastService } from 'app/service/toast-service';
import { UserDataExportResourceApiService } from 'app/generated';
import { Subscription, firstValueFrom, interval } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { SelectComponent, SelectOption } from '../components/atoms/select/select.component';
import TranslateDirective from '../language/translate.directive';
import { ButtonComponent } from '../components/atoms/button/button.component';
import { TabItem, TabPanelTemplateDirective, TabViewComponent } from '../components/molecules/tab-view/tab-view.component';

import { EmailSettingsComponent } from './email-settings/email-settings.component';
import { PersonalInformationSettingsComponent } from './personal-information-settings';

type SettingsTab = 'general' | 'notifications' | 'personal-information';
@Component({
  selector: 'jhi-settings',
  imports: [
    TranslateDirective,
    EmailSettingsComponent,
    PersonalInformationSettingsComponent,
    SelectComponent,
    ButtonComponent,
    TabViewComponent,
    TabPanelTemplateDirective,
    FontAwesomeModule,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  readonly activeTab = signal<SettingsTab>('general');
  readonly role = signal<UserShortDTO.RolesEnum | undefined>(undefined);

  readonly tabs = computed<TabItem[]>(() => {
    const baseTabs: TabItem[] = [{ id: 'general', translationKey: 'settings.tabs.general' }];

    // Hide notifications tab for admins
    if (this.role() !== UserShortDTO.RolesEnum.Admin) {
      baseTabs.push({ id: 'notifications', translationKey: 'settings.tabs.notifications', icon: ['fas', 'bell'] });
    }

    // Add Personal Information tab only for applicants
    if (this.role() === UserShortDTO.RolesEnum.Applicant) {
      baseTabs.push({ id: 'personal-information', translationKey: 'settings.tabs.personalInformation' });
    }

    return baseTabs;
  });

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
  private readonly destroyRef = inject(DestroyRef);

  // Internal subscription used for the cooldown interval
  private exportCooldownSub: Subscription | null = null;

  constructor() {
    const authorities = this.accountService.loadedUser()?.authorities;
    this.role.set(authorities?.map(authority => authority as UserShortDTO.RolesEnum)[0]);

    this.destroyRef.onDestroy(() => {
      this.exportCooldownSub?.unsubscribe();
      this.exportCooldownSub = null;
    });
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

  onTabChange(tabId: string): void {
    if (this.tabs().some(tab => tab.id === tabId)) {
      this.activeTab.set(tabId as SettingsTab);
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
      const response = await firstValueFrom(
        this.userDataExportService.exportUserData('response', false, { httpHeaderAccept: 'application/zip' }),
      );

      const blob = response.body;
      if (blob && blob.size > 0) {
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `user-data-export-${new Date().toISOString()}.zip`;
        if (contentDisposition) {
          const match = /filename="([^"]+)"/.exec(contentDisposition);
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
    // Clear any existing interval subscription
    this.exportCooldownSub?.unsubscribe();
    this.exportCooldownSub = null;

    this.exportCooldownRemaining.set(seconds);

    this.exportCooldownSub = interval(1000).subscribe(() => {
      const remaining = this.exportCooldownRemaining();
      if (remaining <= 1) {
        this.exportCooldownRemaining.set(0);
        this.exportCooldownSub?.unsubscribe();
        this.exportCooldownSub = null;
      } else {
        this.exportCooldownRemaining.set(remaining - 1);
      }
    });
  }
}
