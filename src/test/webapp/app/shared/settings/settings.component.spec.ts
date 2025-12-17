import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsComponent } from 'app/shared/settings/settings.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { createTranslateServiceMock, provideTranslateMock } from '../../../util/translate.mock';
import { EmailSettingResourceApiService } from 'app/generated/api/emailSettingResourceApi.service';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';
import { setupWindowMatchMediaMock } from '../../../util/theme.service.mock';
import { UserDataExportResourceApiService } from 'app/generated';
import { HttpHeaders } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('SettingsComponent', () => {
  let accountServiceMock: ReturnType<typeof createAccountServiceMock>;
  let translateMock: ReturnType<typeof createTranslateServiceMock>;

  const emailSettingServiceMock = {
    getEmailSettings: vi.fn(),
    updateEmailSettings: vi.fn(),
  };

  const toastServiceMock = createToastServiceMock();

  const userDataExportServiceMock = {
    exportUserData: vi.fn(),
  };

  beforeEach(() => {
    setupWindowMatchMediaMock();

    accountServiceMock = createAccountServiceMock();
    translateMock = createTranslateServiceMock();

    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideAccountServiceMock(accountServiceMock),
        provideTranslateMock(translateMock),
        provideToastServiceMock(toastServiceMock),
        { provide: EmailSettingResourceApiService, useValue: emailSettingServiceMock },
        { provide: UserDataExportResourceApiService, useValue: userDataExportServiceMock },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should set role from AccountService authorities', () => {
    accountServiceMock.user.set({
      id: 'u1',
      name: 'Test User',
      email: 'user@test.com',
      authorities: [UserShortDTO.RolesEnum.Professor],
    });

    const component = TestBed.createComponent(SettingsComponent).componentInstance;
    expect(component.role()).toBe(UserShortDTO.RolesEnum.Professor);
  });

  it('should keep role undefined if no user is loaded', () => {
    accountServiceMock.user.set(undefined);

    const component = TestBed.createComponent(SettingsComponent).componentInstance;
    expect(component.role()).toBeUndefined();
  });

  it('should keep role undefined if authorities array is empty', () => {
    accountServiceMock.user.set({
      id: 'u1',
      name: 'Test User',
      email: 'user@test.com',
      authorities: [],
    });

    const component = TestBed.createComponent(SettingsComponent).componentInstance;
    expect(component.role()).toBeUndefined();
  });

  it('should download export and start cooldown on success', async () => {
    const blob = new Blob(['zip'], { type: 'application/zip' });
    const headers = new HttpHeaders({ 'X-Export-Cooldown': '60', 'Content-Disposition': 'attachment; filename="user-data.zip"' });
    const response = new (await import('@angular/common/http')).HttpResponse({ body: blob, headers });

    userDataExportServiceMock.exportUserData.mockReturnValue(of(response));

    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    const startSpy = vi.spyOn(component, 'startExportCooldown');

    const createSpy = vi.spyOn(document, 'createElement');
    createSpy.mockImplementation(() => ({ href: '', download: '', style: { display: '' }, click: vi.fn(), remove: vi.fn() }) as any);

    await component.exportUserData();

    expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.privacy.export.started');
    expect(startSpy).toHaveBeenCalledWith(60);

    createSpy.mockRestore();
  });

  it('should show error toast on export failure', async () => {
    userDataExportServiceMock.exportUserData.mockReturnValue(throwError(() => new Error('error')));

    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    await component.exportUserData();

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.privacy.export.failed');
  });
});
