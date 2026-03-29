import { Component, WritableSignal, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { EmailSettingResourceApi } from 'app/generated/api/email-setting-resource-api';
import { EmailSettingDTO, EmailSettingDTOEmailTypeEnum as EmailTypeEnum } from 'app/generated/model/email-setting-dto';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { ToastService } from 'app/service/toast-service';
import { ToggleSwitchComponent } from 'app/shared/components/atoms/toggle-switch/toggle-switch.component';

import TranslateDirective from '../../language/translate.directive';

import { SubjectAreaSubscriptionsStore } from './subject-area-subscriptions.store';
import { SubjectAreaSubscriptionSelectorComponent } from './subject-area-subscription-selector.component';

const RolesEnum = UserShortDTORolesEnum;
type RolesEnum = UserShortDTORolesEnum;

export interface NotificationGroup {
  groupKey: string; // Title of the group (short)
  descriptionKey: string; // Description of what the setting is for
  emailTypes: EmailTypeEnum[];
  enabled: boolean;
}

@Component({
  selector: 'jhi-notification-settings',
  imports: [
    FontAwesomeModule,
    FormsModule,
    SubjectAreaSubscriptionSelectorComponent,
    ToggleSwitchComponent,
    TranslateModule,
    TranslateDirective,
  ],
  templateUrl: './notification-settings.component.html',
})
export class NotificationSettingsComponent {
  currentRole = input<RolesEnum | undefined>();

  protected readonly emailSettingApi = inject(EmailSettingResourceApi);
  protected readonly toastService = inject(ToastService);
  protected readonly RolesEnum = RolesEnum;
  protected readonly subjectAreaSubscriptions = new SubjectAreaSubscriptionsStore();

  // to control that switches are only displayed when settings are loaded
  protected loaded = signal(false);

  protected readonly roleEffect = effect(() => {
    const role = this.currentRole();
    if (!role) return;

    void this.loadSettings(role);
  });

  protected roleSettings: WritableSignal<Map<RolesEnum, NotificationGroup[]>> = signal(
    new Map<RolesEnum, NotificationGroup[]>([
      [
        UserShortDTORolesEnum.Applicant,
        [
          {
            groupKey: 'settings.notifications.applicant.submission.title',
            descriptionKey: 'settings.notifications.applicant.submission.description',
            emailTypes: [EmailTypeEnum.ApplicationSent, EmailTypeEnum.ApplicationWithdrawn],
            enabled: false,
          },
          {
            groupKey: 'settings.notifications.applicant.outcome.title',
            descriptionKey: 'settings.notifications.applicant.outcome.description',
            emailTypes: [EmailTypeEnum.ApplicationAccepted, EmailTypeEnum.ApplicationRejected],
            enabled: false,
          },
        ],
      ],
      [
        UserShortDTORolesEnum.Professor,
        [
          {
            groupKey: 'settings.notifications.professor.new.title',
            descriptionKey: 'settings.notifications.professor.new.description',
            emailTypes: [EmailTypeEnum.ApplicationReceived],
            enabled: false,
          },
          {
            groupKey: 'settings.notifications.professor.accepted.title',
            descriptionKey: 'settings.notifications.professor.accepted.description',
            emailTypes: [EmailTypeEnum.ApplicationAccepted],
            enabled: false,
          },
        ],
      ],
      [
        UserShortDTORolesEnum.Employee,
        [
          {
            groupKey: 'settings.notifications.professor.new.title',
            descriptionKey: 'settings.notifications.professor.new.description',
            emailTypes: [EmailTypeEnum.ApplicationReceived],
            enabled: false,
          },
          {
            groupKey: 'settings.notifications.professor.accepted.title',
            descriptionKey: 'settings.notifications.professor.accepted.description',
            emailTypes: [EmailTypeEnum.ApplicationAccepted],
            enabled: false,
          },
        ],
      ],
    ]),
  );

  async loadEmailNotificationGroups(role: RolesEnum): Promise<void> {
    try {
      const settings = await firstValueFrom(this.emailSettingApi.getEmailSettings());

      const updatedGroups = this.roleSettings()
        .get(role)
        ?.map(group => {
          const relevantTypes = group.emailTypes;
          const matched = settings.filter(setting => relevantTypes.includes(setting.emailType as EmailTypeEnum));

          const isEnabled = matched.every((s): boolean => s.enabled ?? true);

          return { ...group, enabled: isEnabled };
        });

      if (updatedGroups) {
        const newMap = new Map(this.roleSettings());
        newMap.set(role, updatedGroups);
        this.roleSettings.set(newMap);
      }
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'loading the notification settings' });
    }
  }

  async loadSettings(role: RolesEnum): Promise<void> {
    this.loaded.set(false);

    await this.loadEmailNotificationGroups(role);
    if (role === RolesEnum.Applicant) {
      await this.subjectAreaSubscriptions.load();
    } else {
      this.subjectAreaSubscriptions.reset();
    }

    this.loaded.set(true);
  }

  onToggleChanged(group: NotificationGroup): void {
    const role = this.currentRole();
    const updatedSettings: EmailSettingDTO[] = group.emailTypes.map(emailType => ({
      emailType,
      enabled: group.enabled,
    }));

    try {
      void firstValueFrom(this.emailSettingApi.updateEmailSettings(updatedSettings)).catch(async () => {
        this.toastService.showError({ summary: 'Error', detail: 'updating the notification settings' });

        if (role) {
          await this.loadEmailNotificationGroups(role);
        }
      });
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'updating the notification settings' });

      if (role) {
        void this.loadEmailNotificationGroups(role);
      }
    }
  }
}
