import { Component, WritableSignal, computed, effect, inject, input, signal } from '@angular/core';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { EmailSettingResourceApi } from 'app/generated/api/email-setting-resource-api';
import { ApplicantSubjectAreaSubscriptionsEnum } from 'app/generated/model/applicant';
import { EmailSettingDTO, EmailSettingDTOEmailTypeEnum as EmailTypeEnum } from 'app/generated/model/email-setting-dto';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { ToastService } from 'app/service/toast-service';
import * as DropDownOptions from 'app/job/dropdown-options';

import TranslateDirective from '../../language/translate.directive';
import { FilterChange, FilterMultiselect } from '../../components/atoms/filter-multiselect/filter-multiselect';

const RolesEnum = UserShortDTORolesEnum;
type RolesEnum = UserShortDTORolesEnum;
type SubjectArea = ApplicantSubjectAreaSubscriptionsEnum;

export interface NotificationGroup {
  groupKey: string; // Title of the group (short)
  descriptionKey: string; // Description of what the setting is for
  emailTypes: EmailTypeEnum[];
  enabled: boolean;
}

@Component({
  selector: 'jhi-email-settings',
  host: {
    class: 'block h-full w-full',
  },
  imports: [FontAwesomeModule, FormsModule, FilterMultiselect, ToggleSwitchModule, TranslateModule, TranslateDirective],
  templateUrl: './email-settings.component.html',
})
export class EmailSettingsComponent {
  currentRole = input<RolesEnum | undefined>();

  protected applicantApi = inject(ApplicantResourceApi);
  protected emailSettingApi = inject(EmailSettingResourceApi);
  protected toastService = inject(ToastService);
  protected readonly RolesEnum = RolesEnum;

  // to control that switches are only displayed when settings are loaded
  protected loaded = signal(false);
  protected subjectAreaSaving = signal(false);
  protected subjectAreaDropdownOpen = signal(false);
  protected subjectAreasEnabled = signal(false);
  protected selectedSubjectAreas = signal<SubjectArea[]>([]);
  protected readonly subjectAreaOptions = DropDownOptions.subjectAreas.map(option => ({
    name: option.name,
    value: option.value as SubjectArea,
  }));
  protected readonly subjectAreaFilterOptions: string[] = this.subjectAreaOptions.map(option => option.name);
  protected readonly selectedSubjectAreaFilterValues = computed(() =>
    this.selectedSubjectAreas()
      .map(subjectArea => DropDownOptions.subjectAreaValueToNameMap.get(subjectArea))
      .filter((subjectAreaName): subjectAreaName is string => subjectAreaName !== undefined),
  );
  protected readonly selectedSubjectAreaOptions = computed(() => {
    const selectedAreas = new Set(this.selectedSubjectAreas());
    return this.subjectAreaOptions.filter(option => selectedAreas.has(option.value));
  });

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

  async loadSubjectAreaSubscriptions(): Promise<void> {
    try {
      const subscriptions = await firstValueFrom(this.applicantApi.getSubjectAreaSubscriptions());
      const selectedSubjectAreas = this.sortSubjectAreas(subscriptions as SubjectArea[]);
      this.selectedSubjectAreas.set(selectedSubjectAreas);
    } catch {
      this.selectedSubjectAreas.set([]);
      this.subjectAreasEnabled.set(false);
      this.toastService.showError({ summary: 'Error', detail: 'loading the subject area subscriptions' });
    }
  }

  async loadSettings(role: RolesEnum): Promise<void> {
    this.loaded.set(false);

    await this.loadEmailNotificationGroups(role);
    if (role === RolesEnum.Applicant) {
      await this.loadSubjectAreaSubscriptions();
    } else {
      this.selectedSubjectAreas.set([]);
      this.subjectAreasEnabled.set(false);
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

  async onSubjectAreasChange(subjectAreas: SubjectArea[] | null | undefined): Promise<void> {
    const nextSelection = this.sortSubjectAreas(subjectAreas ?? []);
    const previousSelection = this.selectedSubjectAreas();

    // Check if the selection actually changed to avoid unnecessary API calls.
    if (JSON.stringify(previousSelection) === JSON.stringify(nextSelection)) {
      return;
    }

    const previousSet = new Set(previousSelection);
    const nextSet = new Set(nextSelection);
    const subjectAreasToAdd = nextSelection.filter(subjectArea => !previousSet.has(subjectArea));
    const subjectAreasToRemove = previousSelection.filter(subjectArea => !nextSet.has(subjectArea));

    // Update local state optimistically and sync only the delta with the backend.
    this.selectedSubjectAreas.set(nextSelection);
    this.subjectAreaSaving.set(true);

    try {
      const updateRequests = subjectAreasToAdd
        .map(subjectArea => firstValueFrom(this.applicantApi.addSubjectAreaSubscription(subjectArea)))
        .concat(
          subjectAreasToRemove.map(subjectArea =>
            firstValueFrom(this.applicantApi.removeSubjectAreaSubscription(subjectArea)),
          ),
        );
      await Promise.all(updateRequests);
    } catch {
      this.selectedSubjectAreas.set(previousSelection);
      this.toastService.showError({ summary: 'Error', detail: 'updating the subject area subscriptions' });
      await this.loadSubjectAreaSubscriptions();
    } finally {
      this.subjectAreaSaving.set(false);
    }
  }

  async removeSubjectArea(subjectArea: SubjectArea): Promise<void> {
    await this.onSubjectAreasChange(this.selectedSubjectAreas().filter(selectedSubjectArea => selectedSubjectArea !== subjectArea));
  }

  // TODO: Temporary UI-only toggle for this PR. In the follow-up email-settings PR,
  // this switch will be wired to EmailType.NEW_JOB_POSTING_IN_SUBSCRIBED_SUBJECT_AREA instead of local visibility state.
  onSubjectAreasToggleChanged(enabled: boolean): void {
    this.subjectAreasEnabled.set(enabled);
  }

  onSubjectAreaFilterChange(filterChange: FilterChange): void {
    void this.onSubjectAreasChange(DropDownOptions.mapSubjectAreaNames(filterChange.selectedValues) as SubjectArea[]);
  }

  onSubjectAreaDropdownOpenChange(isOpen: boolean): void {
    this.subjectAreaDropdownOpen.set(isOpen);
  }

  // Keep the selection in the canonical dropdown order so equality checks stay stable.
  private sortSubjectAreas(subjectAreas: readonly SubjectArea[]): SubjectArea[] {
    const subjectAreaSet = new Set(subjectAreas);
    return this.subjectAreaOptions.filter(option => subjectAreaSet.has(option.value)).map(option => option.value);
  }
}
