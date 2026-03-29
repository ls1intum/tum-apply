import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { NotificationSettingsComponent, NotificationGroup } from 'app/shared/settings/notifications/notification-settings.component';
import { EmailSettingResourceApi } from 'app/generated/api/email-setting-resource-api';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { ApplicantSubjectAreaSubscriptionsEnum } from 'app/generated/model/applicant';
import { EmailSettingDTO, EmailSettingDTOEmailTypeEnum } from 'app/generated/model/email-setting-dto';
import { createApplicantResourceApiMock, provideApplicantResourceApiMock } from 'util/applicant-resource-api.service.mock';

const RolesEnum = UserShortDTORolesEnum;
const EmailTypeEnum = EmailSettingDTOEmailTypeEnum;
const SubjectAreaEnum = ApplicantSubjectAreaSubscriptionsEnum;

describe('NotificationSettingsComponent', () => {
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  let component: NotificationSettingsComponent;

  const emailSettingServiceMock = {
    getEmailSettings: vi.fn(),
    updateEmailSettings: vi.fn(),
  };

  const applicantApiMock = createApplicantResourceApiMock();
  const toastServiceMock = createToastServiceMock();
  const subjectAreaSubscriptions = () => component['subjectAreaSubscriptions'];

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [NotificationSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: EmailSettingResourceApi, useValue: emailSettingServiceMock },
        provideApplicantResourceApiMock(applicantApiMock),
        provideToastServiceMock(toastServiceMock),
      ],
    });

    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
  });

  describe('loadSettings', () => {
    it('should update settings and mark loaded when service returns values', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: true },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      expect(groups.every(group => group.enabled)).toBe(true);
      expect(component['loaded']()).toBe(true);
    });

    it('should mark group disabled if any relevant type is disabled', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: false },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      expect(groups.find(group => group.groupKey.includes('submission'))?.enabled).toBe(false);
      expect(component['loaded']()).toBe(true);
    });

    it('should show error toast on service failure', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(throwError(() => new Error('fail')));
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.loadFailed');
      expect(component['loaded']()).toBe(true);
    });

    it('should treat undefined enabled values as true', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: undefined },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      const submissionGroup = groups.find(group => group.groupKey.includes('submission'));
      expect(submissionGroup?.enabled).toBe(true);
      expect(component['loaded']()).toBe(true);
    });

    it('should load subject area subscriptions for applicants', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of<EmailSettingDTO[]>([]));
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.Mathematics, SubjectAreaEnum.ComputerScience]));

      await component.loadSettings(RolesEnum.Applicant);
      subjectAreaSubscriptions().setEnabled(true);
      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      expect(subjectAreaSubscriptions().enabled()).toBe(true);
    });

    it('should clear subject area subscriptions for non-applicants', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of<EmailSettingDTO[]>([]));
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);
      subjectAreaSubscriptions().enabled.set(true);

      await component.loadSettings(RolesEnum.Professor);

      expect(subjectAreaSubscriptions().selected()).toEqual([]);
      expect(subjectAreaSubscriptions().enabled()).toBe(false);
      expect(applicantApiMock.getSubjectAreaSubscriptions).not.toHaveBeenCalled();
    });
  });

  describe('onToggleChanged', () => {
    it('should call updateEmailSettings with correct payload', () => {
      const group: NotificationGroup = {
        groupKey: 'test',
        descriptionKey: 'desc',
        emailTypes: [EmailTypeEnum.ApplicationSent, EmailTypeEnum.ApplicationWithdrawn],
        enabled: true,
      };

      emailSettingServiceMock.updateEmailSettings.mockReturnValue(of(undefined));

      component.onToggleChanged(group);

      expect(emailSettingServiceMock.updateEmailSettings).toHaveBeenCalledWith([
        { emailType: EmailTypeEnum.ApplicationSent, enabled: true },
        { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
      ]);
    });

    it('should show error toast if update throws synchronously', () => {
      emailSettingServiceMock.updateEmailSettings.mockImplementation(() => {
        throw new Error('boom');
      });

      const group: NotificationGroup = {
        groupKey: 'test',
        descriptionKey: 'desc',
        emailTypes: [EmailTypeEnum.ApplicationAccepted],
        enabled: false,
      };

      component.onToggleChanged(group);

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.saveFailed');
    });
  });

  describe('subjectAreaSubscriptions.updateSelection', () => {
    it('should add and remove subscriptions based on the new selection', async () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);
      subjectAreaSubscriptions().enabled.set(true);
      applicantApiMock.addSubjectAreaSubscription.mockReturnValue(of(undefined));
      applicantApiMock.removeSubjectAreaSubscription.mockReturnValue(of(undefined));

      await subjectAreaSubscriptions().updateSelection([SubjectAreaEnum.Mathematics]);

      expect(applicantApiMock.addSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.Mathematics);
      expect(applicantApiMock.removeSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.ComputerScience);
      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.Mathematics]);
      expect(subjectAreaSubscriptions().enabled()).toBe(true);
    });

    it('should do nothing when the selection is unchanged', async () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);

      await subjectAreaSubscriptions().updateSelection([SubjectAreaEnum.ComputerScience]);

      expect(applicantApiMock.addSubjectAreaSubscription).not.toHaveBeenCalled();
      expect(applicantApiMock.removeSubjectAreaSubscription).not.toHaveBeenCalled();
    });

    it('should restore the previous selection when the update fails', async () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);
      subjectAreaSubscriptions().enabled.set(true);
      applicantApiMock.addSubjectAreaSubscription.mockReturnValue(throwError(() => new Error('fail')));
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));

      await subjectAreaSubscriptions().updateSelection([SubjectAreaEnum.Mathematics]);

      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.ComputerScience]);
      expect(subjectAreaSubscriptions().enabled()).toBe(true);
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.applicant.subjectAreas.saveFailed');
    });
  });

  describe('subjectAreaSubscriptions.setEnabled', () => {
    it('should enable the subject areas selector locally when toggled on', () => {
      subjectAreaSubscriptions().setEnabled(true);
      expect(subjectAreaSubscriptions().enabled()).toBe(true);
    });

    it('should only hide the subject areas selector when toggled off', () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      subjectAreaSubscriptions().enabled.set(true);

      subjectAreaSubscriptions().setEnabled(false);

      expect(applicantApiMock.removeSubjectAreaSubscription).not.toHaveBeenCalled();
      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      expect(subjectAreaSubscriptions().enabled()).toBe(false);
    });
  });

  describe('roleEffect', () => {
    it('should not trigger load if no role is set', () => {
      const spy = vi.spyOn(component, 'loadSettings');
      fixture.componentRef.setInput('currentRole', undefined);
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger load once when role is set', async () => {
      const spy = vi.spyOn(component, 'loadSettings').mockResolvedValue();

      fixture.componentRef.setInput('currentRole', RolesEnum.Applicant);
      fixture.detectChanges();
      await Promise.resolve();

      expect(spy).toHaveBeenCalledWith(RolesEnum.Applicant);
    });
  });
});
