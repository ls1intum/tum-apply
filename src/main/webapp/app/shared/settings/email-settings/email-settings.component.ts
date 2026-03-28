import { Component, WritableSignal, effect, inject, input, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { EmailSettingEmailTypeEnum as EmailTypeEnum } from 'app/generated/model/email-setting';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';

import TranslateDirective from '../../language/translate.directive';
import { ToastService } from '../../../service/toast-service';
import { EmailSettingResourceApi } from '../../../generated/api/email-setting-resource-api';
import { EmailSetting } from '../../../generated/model/email-setting';

type RolesEnum = UserShortDTORolesEnum;

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

  protected emailSettingApi = inject(EmailSettingResourceApi);
  protected toastService = inject(ToastService);

  // to control that switches are only displayed when settings are loaded
  protected loaded = signal(false);

  protected readonly roleEffect = effect(() => {
    const role = this.currentRole();
    if (!role) return;

    // Only run once
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
    ]),
  );

  async loadSettings(role: RolesEnum): Promise<void> {
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

      void firstValueFrom(this.emailSettingApi.updateEmailSettings(updatedSettings));
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'updating the notification settings' });
    }
  }
}
