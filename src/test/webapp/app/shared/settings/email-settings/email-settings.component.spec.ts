import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { EmailSettingsComponent, NotificationGroup } from 'app/shared/settings/email-settings/email-settings.component';
import { EmailSettingResourceApiService } from 'app/generated/api/emailSettingResourceApi.service';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { EmailSetting } from 'app/generated/model/emailSetting';
import RolesEnum = UserShortDTO.RolesEnum;
import EmailTypeEnum = EmailSetting.EmailTypeEnum;

describe('EmailSettingsComponent', () => {
  let fixture: ComponentFixture<EmailSettingsComponent>;
  let component: EmailSettingsComponent;

  const emailSettingServiceMock = {
    getEmailSettings: vi.fn(),
    updateEmailSettings: vi.fn(),
  };

  const toastServiceMock = createToastServiceMock();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmailSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: EmailSettingResourceApiService, useValue: emailSettingServiceMock },
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
        of<EmailSetting[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: true },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      expect(groups.every(g => g.enabled)).toBe(true);
      expect(component['loaded']()).toBe(true);
    });

    it('should mark group disabled if any relevant type is disabled', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSetting[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: false },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      expect(groups.find(g => g.groupKey.includes('submission'))?.enabled).toBe(false);
      expect(component['loaded']()).toBe(true);
    });

    it('should show error toast on service failure', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(throwError(() => new Error('fail')));

      await component.loadSettings(RolesEnum.Applicant);

      expect(toastServiceMock.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'loading the notification settings',
      });
      expect(component['loaded']()).toBe(true);
    });

    it('should treat undefined enabled values as true', async () => {
      emailSettingServiceMock.getEmailSettings.mockReturnValue(
        of<EmailSetting[]>([
          { emailType: EmailTypeEnum.ApplicationSent, enabled: undefined },
          { emailType: EmailTypeEnum.ApplicationWithdrawn, enabled: true },
        ]),
      );

      await component.loadSettings(RolesEnum.Applicant);

      const groups = component['roleSettings']().get(RolesEnum.Applicant) ?? [];
      const submissionGroup = groups.find(g => g.groupKey.includes('submission'));
      expect(submissionGroup?.enabled).toBe(true);
      expect(component['loaded']()).toBe(true);
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
