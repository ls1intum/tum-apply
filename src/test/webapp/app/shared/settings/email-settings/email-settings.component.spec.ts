import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { EmailSettingsComponent, NotificationGroup } from 'app/shared/settings/email-settings/email-settings.component';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { EmailSettingResourceApi } from 'app/generated/api/email-setting-resource-api';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { ApplicantSubjectAreaSubscriptionsEnum } from 'app/generated/model/applicant';
import { EmailSettingDTO, EmailSettingDTOEmailTypeEnum } from 'app/generated/model/email-setting-dto';

const RolesEnum = UserShortDTORolesEnum;
const EmailTypeEnum = EmailSettingDTOEmailTypeEnum;
const SubjectAreaEnum = ApplicantSubjectAreaSubscriptionsEnum;

describe('EmailSettingsComponent', () => {
  let fixture: ComponentFixture<EmailSettingsComponent>;
  let component: EmailSettingsComponent;

  const emailSettingServiceMock = {
    getEmailSettings: vi.fn(),
    updateEmailSettings: vi.fn(),
  };

  const applicantResourceApiServiceMock = {
    getSubjectAreaSubscriptions: vi.fn(),
    addSubjectAreaSubscription: vi.fn(),
    removeSubjectAreaSubscription: vi.fn(),
  };

  const toastServiceMock = createToastServiceMock();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmailSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: EmailSettingResourceApi, useValue: emailSettingServiceMock },
        { provide: ApplicantResourceApi, useValue: applicantResourceApiServiceMock },
        provideToastServiceMock(toastServiceMock),
      ],
    });

    fixture = TestBed.createComponent(EmailSettingsComponent);
    component = fixture.componentInstance;

    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('should update settings and mark loaded when service returns values', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: true },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );
      applicantResourceApiServiceMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

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
      applicantResourceApiServiceMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      expect(groups.find(group => group.groupKey.includes('submission'))?.enabled).toBe(false);
      expect(component['loaded']()).toBe(true);
    });

    it('should show error toast on service failure', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(throwError(() => new Error('fail')));
      applicantResourceApiServiceMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      expect(toastServiceMock.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'loading the notification settings',
      });
      expect(component['loaded']()).toBe(true);
    });

    it('should treat undefined enabled values as true', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: undefined },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );
      applicantResourceApiServiceMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      const submissionGroup = groups.find(group => group.groupKey.includes('submission'));
      expect(submissionGroup?.enabled).toBe(true);
      expect(component['loaded']()).toBe(true);
    });

    it('should load subject area subscriptions for applicants', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of<EmailSettingDTO[]>([]));
      applicantResourceApiServiceMock.getSubjectAreaSubscriptions.mockReturnValue(
        of([SubjectAreaEnum.Mathematics, SubjectAreaEnum.ComputerScience]),
      );

      await component.loadSettings(RolesEnum.Applicant);
      component.onSubjectAreasToggleChanged(true);
      expect(component['selectedSubjectAreas']()).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      expect(component['subjectAreasEnabled']()).toBe(true);
    });

    it('should clear subject area subscriptions for non-applicants', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of<EmailSettingDTO[]>([]));
      component['selectedSubjectAreas'].set([SubjectAreaEnum.ComputerScience]);
      component['subjectAreasEnabled'].set(true);

      await component.loadSettings(RolesEnum.Professor);

      expect(component['selectedSubjectAreas']()).toEqual([]);
      expect(component['subjectAreasEnabled']()).toBe(false);
      expect(applicantResourceApiServiceMock.getSubjectAreaSubscriptions).not.toHaveBeenCalled();
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

      expect(toastServiceMock.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'updating the notification settings',
      });
    });
  });

  describe('onSubjectAreasChange', () => {
    it('should add and remove subscriptions based on the new selection', async () => {
      component['selectedSubjectAreas'].set([SubjectAreaEnum.ComputerScience]);
      component['subjectAreasEnabled'].set(true);
      applicantResourceApiServiceMock.addSubjectAreaSubscription.mockReturnValue(of(undefined));
      applicantResourceApiServiceMock.removeSubjectAreaSubscription.mockReturnValue(of(undefined));

      await component.onSubjectAreasChange([SubjectAreaEnum.Mathematics]);

      expect(applicantResourceApiServiceMock.addSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.Mathematics);
      expect(applicantResourceApiServiceMock.removeSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.ComputerScience);
      expect(component['selectedSubjectAreas']()).toEqual([SubjectAreaEnum.Mathematics]);
      expect(component['subjectAreasEnabled']()).toBe(true);
    });

    it('should do nothing when the selection is unchanged', async () => {
      component['selectedSubjectAreas'].set([SubjectAreaEnum.ComputerScience]);

      await component.onSubjectAreasChange([SubjectAreaEnum.ComputerScience]);

      expect(applicantResourceApiServiceMock.addSubjectAreaSubscription).not.toHaveBeenCalled();
      expect(applicantResourceApiServiceMock.removeSubjectAreaSubscription).not.toHaveBeenCalled();
    });

    it('should restore the previous selection when the update fails', async () => {
      component['selectedSubjectAreas'].set([SubjectAreaEnum.ComputerScience]);
      component['subjectAreasEnabled'].set(true);
      applicantResourceApiServiceMock.addSubjectAreaSubscription.mockReturnValue(throwError(() => new Error('fail')));
      applicantResourceApiServiceMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));

      await component.onSubjectAreasChange([SubjectAreaEnum.Mathematics]);

      expect(component['selectedSubjectAreas']()).toEqual([SubjectAreaEnum.ComputerScience]);
      expect(component['subjectAreasEnabled']()).toBe(true);
      expect(toastServiceMock.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'updating the subject area subscriptions',
      });
    });
  });

  describe('onSubjectAreasToggleChanged', () => {
    it('should enable the subject areas selector locally when toggled on', () => {
      component.onSubjectAreasToggleChanged(true);
      expect(component['subjectAreasEnabled']()).toBe(true);
    });

    it('should only hide the subject areas selector when toggled off', () => {
      component['selectedSubjectAreas'].set([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      component['subjectAreasEnabled'].set(true);

      component.onSubjectAreasToggleChanged(false);

      expect(applicantResourceApiServiceMock.removeSubjectAreaSubscription).not.toHaveBeenCalled();
      expect(component['selectedSubjectAreas']()).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      expect(component['subjectAreasEnabled']()).toBe(false);
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
