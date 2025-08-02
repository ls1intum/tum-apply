import { Component, WritableSignal, effect, inject, input, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { EmailSetting, EmailSettingResourceService, UserShortDTO } from '../../../generated';
import TranslateDirective from '../../language/translate.directive';

import EmailTypeEnum = EmailSetting.EmailTypeEnum;
import RolesEnum = UserShortDTO.RolesEnum;

export interface NotificationGroup {
  groupKey: string; // Title of the group (short)
  descriptionKey: string; // Description of what the setting is for
  emailTypes: EmailTypeEnum[];
  enabled: boolean;
}

@Component({
  selector: 'jhi-email-settings',
  imports: [DividerModule, FontAwesomeModule, FormsModule, ToggleSwitchModule, TooltipModule, TranslateModule, TranslateDirective],
  templateUrl: './email-settings.component.html',
  styleUrl: './email-settings.component.scss',
})
export class EmailSettingsComponent {
  currentRole = input<RolesEnum | undefined>();

  protected emailSettingService = inject(EmailSettingResourceService);

  // to control that switches are only displayed when settings are loaded
  protected loaded = signal(false);

  protected roleSettings: WritableSignal<Map<RolesEnum, NotificationGroup[]>> = signal(
    new Map<RolesEnum, NotificationGroup[]>([
      [
        RolesEnum.Applicant,
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
        RolesEnum.Professor,
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

  constructor() {
    effect(() => {
      const role = this.currentRole();
      if (!role) return;

      // Only run once
      void this.loadSettings(role);
    });
  }

  async loadSettings(role: RolesEnum): Promise<void> {
    try {
      const settings = await firstValueFrom(this.emailSettingService.getEmailSettings());

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
    } catch (err) {
      console.error('Failed to load email settings:', err);
    } finally {
      this.loaded.set(true);
    }
  }

  onToggleChanged(group: NotificationGroup): void {
    try {
      const updatedSettings: EmailSetting[] = group.emailTypes.map(emailType => ({
        emailType,
        enabled: group.enabled,
      }));

      void firstValueFrom(this.emailSettingService.updateEmailSettings(updatedSettings));
    } catch (err) {
      console.error('Failed to update email settings:', err);
    }
  }
}
