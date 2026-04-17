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
      imports: [NotificationSettingsComponent],
      providers: [
        { provide: EmailSettingResourceApi, useValue: emailSettingServiceMock },
        provideApplicantResourceApiMock(applicantApiMock),
        provideFontAwesomeTesting(),
        provideToastServiceMock(toastServiceMock),
        provideTranslateMock(),
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

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      const submissionGroup = groups.find(group => group.groupKey.includes('submission'));
      expect(submissionGroup?.enabled).toBe(true);
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
  });

  describe('template', () => {
    it('should render the applicant subject area notification section', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([{ emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: true }]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));

      fixture.componentRef.setInput('currentRole', RolesEnum.Applicant);
      fixture.detectChanges();
      await component.loadSettings(RolesEnum.Applicant);
      fixture.detectChanges();

      const renderedText = fixture.nativeElement.textContent ?? '';
      const animatedContainer = fixture.nativeElement.querySelector('[aria-hidden]');

      expect(renderedText).toContain('settings.notifications.applicant.subjectAreas.title');
      expect(animatedContainer?.getAttribute('aria-hidden')).toBe('false');
      expect(animatedContainer?.className).toContain('max-h-screen');
    });

    it('should keep the subject area selector collapsed when the notification toggle is disabled', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSettingDTO[]>([{ emailType: EmailTypeEnum.JobPublishedSubjectArea, enabled: false }]),
      );
      applicantApiMock.getSubjectAreaSubscriptions.mockReturnValue(of([SubjectAreaEnum.ComputerScience]));

      fixture.componentRef.setInput('currentRole', RolesEnum.Applicant);
      fixture.detectChanges();
      await component.loadSettings(RolesEnum.Applicant);
      fixture.detectChanges();

      const animatedContainer = fixture.nativeElement.querySelector('[aria-hidden]');

      expect(animatedContainer?.getAttribute('aria-hidden')).toBe('true');
      expect(animatedContainer?.className).toContain('max-h-0');
    });

    it('should not render the subject area section for non-applicant roles', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(of<EmailSettingDTO[]>([]));

      fixture.componentRef.setInput('currentRole', RolesEnum.Professor);
      fixture.detectChanges();
      await component.loadSettings(RolesEnum.Professor);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent ?? '').not.toContain('settings.notifications.applicant.subjectAreas.title');
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
