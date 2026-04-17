import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { NotificationSettingsComponent, NotificationGroup } from 'app/shared/settings/notifications/notification-settings.component';
import { EmailSettingResourceApi } from 'app/generated/api/email-setting-resource-api';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { provideTranslateMock } from '../../../../util/translate.mock';
import { JobCardDTOSubjectAreaEnum as ApplicantSubjectAreaSubscriptionsEnum } from 'app/generated/model/job-card-dto';
import { EmailSettingDTO, EmailSettingDTOEmailTypeEnum } from 'app/generated/model/email-setting-dto';
import { createApplicantResourceApiMock, provideApplicantResourceApiMock } from 'util/applicant-resource-api.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { getRequiredDiv } from 'util/utility-methods/dom-query.util';

const RolesEnum = UserShortDTORolesEnum;
const EmailTypeEnum = EmailSettingDTOEmailTypeEnum;
const SubjectAreaEnum = ApplicantSubjectAreaSubscriptionsEnum;

describe('NotificationSettingsComponent', () => {
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  let component: NotificationSettingsComponent;
  let subjectAreaSubscriptions: () => NotificationSettingsComponent['subjectAreaSubscriptions'];
  let getSubmissionGroup: () => NotificationGroup;
  let setRoleAndWaitForLoad: (role: UserShortDTORolesEnum) => Promise<void>;

  const emailSettingServiceMock = {
    getEmailSettings: vi.fn(),
    updateEmailSettings: vi.fn(),
  };

  const applicantApiMock = createApplicantResourceApiMock();
  const toastServiceMock = createToastServiceMock();
  const createComponent = () => {
    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;

    const waitForLoaded = async () => {
      for (let attempts = 0; attempts < 5; attempts += 1) {
        await fixture.whenStable();
        fixture.detectChanges();
        if (component['loaded']()) {
          return;
        }
        await Promise.resolve();
      }
      throw new Error('Expected notification settings to finish loading');
    };

    subjectAreaSubscriptions = () => component['subjectAreaSubscriptions'];
    getSubmissionGroup = () => {
      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      const group = groups.find(entry => entry.groupKey.includes('submission'));
      if (!group) {
        throw new Error('Expected applicant submission notification group');
      }
      return group;
    };
    setRoleAndWaitForLoad = async (role: UserShortDTORolesEnum) => {
      fixture.componentRef.setInput('currentRole', role);
      fixture.detectChanges();
      await waitForLoaded();
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [NotificationSettingsComponent],
      providers: [
        { provide: EmailSettingResourceApi, useValue: emailSettingServiceMock },
        provideApplicantResourceApiMock(applicantApiMock),
        provideFontAwesomeTesting(),
        provideToastServiceMock(toastServiceMock),
        provideTranslateMock(),
      ],
    });

    createComponent();
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

      expect(getSubmissionGroup().enabled).toBe(false);
      expect(component['loaded']()).toBe(true);
    });

    it('should show error toast on service failure', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(throwError(() => new Error('fail')));
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
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

      expect(getSubmissionGroup().enabled).toBe(true);
      expect(component['loaded']()).toBe(true);
    });

    it('should load subject area subscriptions for applicants', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([{ emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: true }]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.Mathematics, SubjectAreaEnum.ComputerScience]));

      await component.loadSettings(RolesEnum.Applicant);

      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      expect(component['subjectAreaNotificationsEnabled']()).toBe(true);
    });

    it('should clear subject area subscriptions for non-applicants', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of<EmailSettingDTO[]>([]));
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);

      await component.loadSettings(RolesEnum.Professor);

      expect(subjectAreaSubscriptions().selected()).toEqual([]);
      expect(component['subjectAreaNotificationsEnabled']()).toBe(true);
      expect(applicantApiMock.getSubjectAreaSubscriptions).not.toHaveBeenCalled();
    });

    it('should load the subject area notification toggle from email settings', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([{ emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: false }]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([]));

      await component.loadSettings(RolesEnum.Applicant);

      expect(component['subjectAreaNotificationsEnabled']()).toBe(false);
    });

    it('should ignore role-specific groups when the role has no configured notification groups', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([{ emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: false }]),
      );

      await component.loadSettings(RolesEnum.Admin);

      expect(component['roleSettings']().has(RolesEnum.Admin)).toBe(false);
      expect(component['subjectAreaNotificationsEnabled']()).toBe(false);
      expect(component['loaded']()).toBe(true);
    });
  });

  describe('template', () => {
    it('should render the applicant subject area notification section', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([{ emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: true }]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));

      await setRoleAndWaitForLoad(RolesEnum.Applicant);

      const renderedText = fixture.nativeElement.textContent ?? '';
      const animatedContainer = getRequiredDiv(fixture.nativeElement, '[aria-hidden]');

      expect(renderedText).toContain('settings.notifications.applicant.subjectAreas.title');
      expect(animatedContainer.getAttribute('aria-hidden')).toBe('false');
      expect(animatedContainer.className).toContain('max-h-screen');
      expect(emailSettingServiceMock.getEmailSettings).toHaveBeenCalledOnce();
      expect(applicantApiMock.getSubjectAreaSubscriptions).toHaveBeenCalledOnce();
    });

    it('should keep the subject area selector collapsed when the notification toggle is disabled', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([{ emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: false }]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));

      await setRoleAndWaitForLoad(RolesEnum.Applicant);

      const animatedContainer = getRequiredDiv(fixture.nativeElement, '[aria-hidden]');

      expect(animatedContainer.getAttribute('aria-hidden')).toBe('true');
      expect(animatedContainer.className).toContain('max-h-0');
      expect(emailSettingServiceMock.getEmailSettings).toHaveBeenCalledOnce();
      expect(applicantApiMock.getSubjectAreaSubscriptions).toHaveBeenCalledOnce();
    });

    it('should not render the subject area section for non-applicant roles', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of<EmailSettingDTO[]>([]));

      await setRoleAndWaitForLoad(RolesEnum.Professor);

      expect(fixture.nativeElement.textContent ?? '').not.toContain('settings.notifications.applicant.subjectAreas.title');
      expect(emailSettingServiceMock.getEmailSettings).toHaveBeenCalledOnce();
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

      expect(emailSettingServiceMock.updateEmailSettings).toHaveBeenCalledOnce();
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

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.saveFailed');
    });

    it('should reload the email notification groups when the async update fails and a role is set', async () => {
      fixture.componentRef.setInput('currentRole', RolesEnum.Applicant);
      emailSettingServiceMock.updateEmailSettings.mockReturnValue(throwError(() => new Error('boom')));
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of([]));
      const reloadSpy = vi.spyOn(component, 'loadEmailNotificationGroups').mockResolvedValue();

      component.onToggleChanged({
        groupKey: 'test',
        descriptionKey: 'desc',
        emailTypes: [EmailTypeEnum.ApplicationAccepted],
        enabled: false,
      });
      await Promise.resolve();

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.saveFailed');
      expect(reloadSpy).toHaveBeenCalledOnce();
      expect(reloadSpy).toHaveBeenCalledWith(RolesEnum.Applicant);
    });

    it('should reload the email notification groups when a synchronous update error occurs and a role is set', () => {
      fixture.componentRef.setInput('currentRole', RolesEnum.Applicant);
      emailSettingServiceMock.updateEmailSettings.mockImplementation(() => {
        throw new Error('boom');
      });
      const reloadSpy = vi.spyOn(component, 'loadEmailNotificationGroups').mockResolvedValue();

      component.onToggleChanged({
        groupKey: 'test',
        descriptionKey: 'desc',
        emailTypes: [EmailTypeEnum.ApplicationAccepted],
        enabled: false,
      });

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.saveFailed');
      expect(reloadSpy).toHaveBeenCalledOnce();
      expect(reloadSpy).toHaveBeenCalledWith(RolesEnum.Applicant);
    });
  });

  describe('subjectAreaSubscriptions.updateSelection', () => {
    it('should add and remove subscriptions based on the new selection', async () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);
      applicantApiMock.addSubjectAreaSubscription.mockReturnValue(of(undefined));
      applicantApiMock.removeSubjectAreaSubscription.mockReturnValue(of(undefined));

      await subjectAreaSubscriptions().updateSelection([SubjectAreaEnum.Mathematics]);

      expect(applicantApiMock.addSubjectAreaSubscription).toHaveBeenCalledOnce();
      expect(applicantApiMock.addSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.Mathematics);
      expect(applicantApiMock.removeSubjectAreaSubscription).toHaveBeenCalledOnce();
      expect(applicantApiMock.removeSubjectAreaSubscription).toHaveBeenCalledWith(SubjectAreaEnum.ComputerScience);
      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.Mathematics]);
    });

    it('should do nothing when the selection is unchanged', async () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);

      await subjectAreaSubscriptions().updateSelection([SubjectAreaEnum.ComputerScience]);

      expect(applicantApiMock.addSubjectAreaSubscription).not.toHaveBeenCalled();
      expect(applicantApiMock.removeSubjectAreaSubscription).not.toHaveBeenCalled();
    });

    it('should restore the previous selection when the update fails', async () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience]);
      applicantApiMock.addSubjectAreaSubscription.mockReturnValue(throwError(() => new Error('fail')));
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));

      await subjectAreaSubscriptions().updateSelection([SubjectAreaEnum.Mathematics]);

      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.ComputerScience]);
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledOnce();
      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.applicant.subjectAreas.saveFailed');
    });
  });

  describe('onSubjectAreaToggleChanged', () => {
    it('should persist the subject area notification setting', () => {
      emailSettingServiceMock.updateEmailSettings.mockReturnValue(of(undefined));

      component.onSubjectAreaToggleChanged(false);

      expect(emailSettingServiceMock.updateEmailSettings).toHaveBeenCalledOnce();
      expect(emailSettingServiceMock.updateEmailSettings).toHaveBeenCalledWith([
        { emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: false },
      ]);
      expect(component['subjectAreaNotificationsEnabled']()).toBe(false);
    });

    it('should not clear selected subject areas when toggled off', () => {
      subjectAreaSubscriptions().selected.set([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
      emailSettingServiceMock.updateEmailSettings.mockReturnValue(of(undefined));

      component.onSubjectAreaToggleChanged(false);

      expect(applicantApiMock.removeSubjectAreaSubscription).not.toHaveBeenCalled();
      expect(subjectAreaSubscriptions().selected()).toEqual([SubjectAreaEnum.ComputerScience, SubjectAreaEnum.Mathematics]);
    });

    it('should reload the email notification groups when the subject area toggle save fails and a role is set', async () => {
      fixture.componentRef.setInput('currentRole', RolesEnum.Applicant);
      emailSettingServiceMock.updateEmailSettings.mockReturnValue(throwError(() => new Error('boom')));
      const reloadSpy = vi.spyOn(component, 'loadEmailNotificationGroups').mockResolvedValue();

      component.onSubjectAreaToggleChanged(false);
      await Promise.resolve();

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.saveFailed');
      expect(reloadSpy).toHaveBeenCalledOnce();
      expect(reloadSpy).toHaveBeenCalledWith(RolesEnum.Applicant);
    });

    it('should not reload the email notification groups when the subject area toggle save fails without a current role', async () => {
      emailSettingServiceMock.updateEmailSettings.mockReturnValue(throwError(() => new Error('boom')));
      const reloadSpy = vi.spyOn(component, 'loadEmailNotificationGroups').mockResolvedValue();

      component.onSubjectAreaToggleChanged(false);
      await Promise.resolve();

      expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.notifications.saveFailed');
      expect(reloadSpy).not.toHaveBeenCalled();
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

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(RolesEnum.Applicant);
    });
  });
});
