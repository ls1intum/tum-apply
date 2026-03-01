import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { ThemeOption, ThemeService } from 'app/service/theme.service';
import { Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { SelectComponent, SelectOption } from '../components/atoms/select/select.component';
import TranslateDirective from '../language/translate.directive';
import { TabItem, TabPanelTemplateDirective, TabViewComponent } from '../components/molecules/tab-view/tab-view.component';

import { EmailSettingsComponent } from './email-settings/email-settings.component';
import { PersonalInformationSettingsComponent } from './personal-information-settings';
import { SettingsDocumentsComponent } from './settings-documents/settings-documents.component';

type SettingsTab = 'general' | 'notifications' | 'personal-information' | 'documents';
@Component({
  selector: 'jhi-settings',
  imports: [
    TranslateDirective,
    EmailSettingsComponent,
    PersonalInformationSettingsComponent,
    SettingsDocumentsComponent,
    SelectComponent,
    TabViewComponent,
    TabPanelTemplateDirective,
    FontAwesomeModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly activeTab = signal<SettingsTab>('general');
  readonly role = signal<UserShortDTO.RolesEnum | undefined>(undefined);

  readonly tabs = computed<TabItem[]>(() => {
    const baseTabs: TabItem[] = [{ id: 'general', translationKey: 'settings.tabs.general' }];

    // Hide notifications tab for admins
    if (this.role() !== UserShortDTO.RolesEnum.Admin) {
      baseTabs.push({ id: 'notifications', translationKey: 'settings.tabs.notifications' });
    }

    // Add Personal Information and documents tabs only for applicants
    if (this.role() === UserShortDTO.RolesEnum.Applicant) {
      baseTabs.push({ id: 'personal-information', translationKey: 'settings.tabs.personalInformation' });
      baseTabs.push({ id: 'documents', translationKey: 'settings.tabs.documents' });
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
}
