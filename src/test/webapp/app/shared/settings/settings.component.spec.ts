import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsComponent } from 'app/shared/settings/settings.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { createThemeServiceMock, provideThemeServiceMock, setupWindowMatchMediaMock } from '../../../util/theme.service.mock';
import { createTranslateServiceMock, provideTranslateMock } from '../../../util/translate.mock';
import { EmailSettingResourceApiService } from 'app/generated/api/emailSettingResourceApi.service';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';
import { UserDataExportResourceApiService } from 'app/generated';
import { HttpHeaders } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('SettingsComponent', () => {
  let accountServiceMock: ReturnType<typeof createAccountServiceMock>;
  let translateMock: ReturnType<typeof createTranslateServiceMock>;
  let themeServiceMock: ReturnType<typeof createThemeServiceMock>;

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
    themeServiceMock = createThemeServiceMock();

    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideAccountServiceMock(accountServiceMock),
        provideTranslateMock(translateMock),
        provideThemeServiceMock(themeServiceMock),
        provideToastServiceMock(toastServiceMock),
        provideFontAwesomeTesting(),
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

    const origCreateElement = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName?: string) => {
      // Only stub anchor creation to avoid breaking TestBed internals
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          style: { display: '' },
          click: vi.fn(),
          remove: vi.fn(),
        } as unknown as HTMLAnchorElement;
      }
      return origCreateElement(tagName as string);
    });

    const originalURL = window.URL;
    const createObjectSpy = vi.fn(() => 'blob:mock');
    const revokeObjectSpy = vi.fn();

    const mockURL = {
      createObjectURL: createObjectSpy,
      revokeObjectURL: revokeObjectSpy,
    } as unknown as typeof URL;

    Object.defineProperty(window, 'URL', { value: mockURL, writable: true });

    try {
      // sanity checks to help debugging if something prevents the call
      expect(component.exportButtonDisabled()).toBe(false);

      await component.exportUserData();

      expect(userDataExportServiceMock.exportUserData).toHaveBeenCalledWith('response', false, { httpHeaderAccept: 'application/zip' });
      expect(createObjectSpy).toHaveBeenCalled();
      expect(revokeObjectSpy).toHaveBeenCalled();
      expect(toastServiceMock.showSuccessKey).toHaveBeenCalledWith('settings.privacy.export.started');
      expect(startSpy).toHaveBeenCalledWith(60);
    } finally {
      createSpy.mockRestore();
      Object.defineProperty(window, 'URL', { value: originalURL, writable: true });
    }
  });

  it('should handle various cooldown header scenarios', async () => {
    const blob = new Blob(['zip'], { type: 'application/zip' });
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;
    const startSpy = vi.spyOn(component, 'startExportCooldown');

    // Mock URL and DOM once for this test
    const originalURL = window.URL;
    const mockURL = { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() };
    Object.defineProperty(window, 'URL', { value: mockURL, writable: true });
    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue({ click: vi.fn(), href: '', download: '' } as any);

    try {
      // 1. Fallback to X-Cooldown-Seconds
      let headers = new HttpHeaders({ 'X-Cooldown-Seconds': '30', 'Content-Disposition': 'attachment' });
      let response = new (await import('@angular/common/http')).HttpResponse({ body: blob, headers });
      userDataExportServiceMock.exportUserData.mockReturnValue(of(response));
      await component.exportUserData();
      expect(startSpy).toHaveBeenLastCalledWith(30);

      // Reset cooldown for next step
      component.exportCooldownRemaining.set(0);

      // 2. Invalid number -> default 60
      headers = new HttpHeaders({ 'X-Export-Cooldown': 'invalid', 'Content-Disposition': 'attachment' });
      response = new (await import('@angular/common/http')).HttpResponse({ body: blob, headers });
      userDataExportServiceMock.exportUserData.mockReturnValue(of(response));
      await component.exportUserData();
      expect(startSpy).toHaveBeenLastCalledWith(60);

      // Reset cooldown for next step
      component.exportCooldownRemaining.set(0);

      // 3. Negative number -> default 60
      headers = new HttpHeaders({ 'X-Export-Cooldown': '-5', 'Content-Disposition': 'attachment' });
      response = new (await import('@angular/common/http')).HttpResponse({ body: blob, headers });
      userDataExportServiceMock.exportUserData.mockReturnValue(of(response));
      await component.exportUserData();
      expect(startSpy).toHaveBeenLastCalledWith(60);

      // Reset cooldown for next step
      component.exportCooldownRemaining.set(0);

      // 4. No headers -> default 60
      headers = new HttpHeaders({ 'Content-Disposition': 'attachment' });
      response = new (await import('@angular/common/http')).HttpResponse({ body: blob, headers });
      userDataExportServiceMock.exportUserData.mockReturnValue(of(response));
      await component.exportUserData();
      expect(startSpy).toHaveBeenLastCalledWith(60);
    } finally {
      Object.defineProperty(window, 'URL', { value: originalURL, writable: true });
      createSpy.mockRestore();
    }
  });

  it('should show error toast on export failure', async () => {
    userDataExportServiceMock.exportUserData.mockReturnValue(throwError(() => new Error('error')));

    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    await component.exportUserData();

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.privacy.export.failed');
  });

  it('should show error toast if export returns empty blob', async () => {
    const response = new (await import('@angular/common/http')).HttpResponse({ body: null });
    userDataExportServiceMock.exportUserData.mockReturnValue(of(response));

    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    await component.exportUserData();

    expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.privacy.export.failed');
  });

  it('should not export if button is disabled', async () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    // Simulate disabled state (e.g. cooldown active)
    component.startExportCooldown(60);
    expect(component.exportButtonDisabled()).toBe(true);

    await component.exportUserData();

    expect(userDataExportServiceMock.exportUserData).not.toHaveBeenCalled();
  });

  it('should handle cooldown timer correctly', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    component.startExportCooldown(3);
    expect(component.exportCooldownRemaining()).toBe(3);

    vi.advanceTimersByTime(1000);
    expect(component.exportCooldownRemaining()).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(component.exportCooldownRemaining()).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(component.exportCooldownRemaining()).toBe(0);

    vi.useRealTimers();
  });

  it('should reset cooldown when starting new cooldown', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    component.startExportCooldown(10);
    component.startExportCooldown(5);
    expect(component.exportCooldownRemaining()).toBe(5);

    // Ensure the previous cooldown was cleared (otherwise it would tick twice per second)
    vi.advanceTimersByTime(1000);
    expect(component.exportCooldownRemaining()).toBe(4);

    vi.useRealTimers();
  });

  it('should stop cooldown on destroy', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    component.startExportCooldown(10);

    vi.advanceTimersByTime(1000);
    expect(component.exportCooldownRemaining()).toBe(9);

    fixture.destroy();

    // After destroy, the interval subscription should be cleaned up
    vi.advanceTimersByTime(3000);
    expect(component.exportCooldownRemaining()).toBe(9);

    vi.useRealTimers();
  });

  it('should set theme to system when system option selected', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    component.onThemeChange({ name: 'System', value: 'system' });

    expect(themeServiceMock.setSyncWithSystem).toHaveBeenCalledWith(true);
  });

  it('should set specific theme when non-system option selected', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    component.onThemeChange({ name: 'Dark', value: 'dark' });

    expect(themeServiceMock.setSyncWithSystem).toHaveBeenCalledWith(false);
    expect(themeServiceMock.setTheme).toHaveBeenCalledWith('dark');
  });

  it('should compute selectedTheme correctly based on theme service state', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;

    // Case 1: Sync with system
    themeServiceMock.syncWithSystem.set(true);
    fixture.detectChanges();
    expect(component.selectedTheme().value).toBe('system');

    // Case 2: Specific theme
    themeServiceMock.syncWithSystem.set(false);
    themeServiceMock.theme.set('dark');
    fixture.detectChanges();
    expect(component.selectedTheme().value).toBe('dark');

    // Case 3: Fallback (unknown theme)
    themeServiceMock.theme.set('unknown' as any);
    fixture.detectChanges();
    expect(component.selectedTheme().value).toBe('light'); // Assuming light is first
  });
});
