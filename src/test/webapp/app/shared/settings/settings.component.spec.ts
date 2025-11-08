import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsComponent } from 'app/shared/settings/settings.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { createTranslateServiceMock, provideTranslateMock } from '../../../util/translate.mock';
import { EmailSettingResourceApiService } from 'app/generated/api/emailSettingResourceApi.service';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';

describe('SettingsComponent', () => {
  let accountServiceMock: ReturnType<typeof createAccountServiceMock>;
  let translateMock: ReturnType<typeof createTranslateServiceMock>;

  const emailSettingServiceMock = {
    getEmailSettings: vi.fn(),
    updateEmailSettings: vi.fn(),
  };

  const toastServiceMock = createToastServiceMock();

  beforeEach(() => {
    accountServiceMock = createAccountServiceMock();
    translateMock = createTranslateServiceMock();

    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideAccountServiceMock(accountServiceMock),
        provideTranslateMock(translateMock),
        provideToastServiceMock(toastServiceMock),
        { provide: EmailSettingResourceApiService, useValue: emailSettingServiceMock },
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
});
