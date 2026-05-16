import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CredentialsGroupComponent } from 'app/shared/components/molecules/credentials-group/credentials-group.component';

import {
  BreakpointObserverMock,
  createBreakpointObserverMock,
  provideBreakpointObserverMock,
} from '../../../../../util/breakpoint-observer.mock';

import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import {
  AuthFacadeServiceMock,
  createAuthFacadeServiceMock,
  provideAuthFacadeServiceMock,
} from '../../../../../util/auth-facade.service.mock';
import {
  AuthOrchestratorServiceMock,
  createAuthOrchestratorServiceMock,
  provideAuthOrchestratorServiceMock,
} from '../../../../../util/auth-orchestrator.service.mock';
import {
  ApplicationConfigServiceMock,
  createApplicationConfigServiceMock,
  provideApplicationConfigServiceMock,
} from '../../../../../util/application-config.service.mock';

describe('CredentialsGroupComponent', () => {
  let applicationConfigMock: ApplicationConfigServiceMock;
  let authOrchestratorServiceMock: AuthOrchestratorServiceMock;
  let authFacadeMock: AuthFacadeServiceMock;
  let breakpointObserverMock: BreakpointObserverMock;

  function createComponent() {
    return TestBed.createComponent(CredentialsGroupComponent);
  }

  beforeEach(async () => {
    applicationConfigMock = createApplicationConfigServiceMock({
      otp: {
        length: 6,
        ttlSeconds: 90,
        resendCooldownSeconds: 60,
      },
    });
    authFacadeMock = createAuthFacadeServiceMock();
    authOrchestratorServiceMock = createAuthOrchestratorServiceMock();

    breakpointObserverMock = createBreakpointObserverMock();

    await TestBed.configureTestingModule({
      imports: [CredentialsGroupComponent],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideApplicationConfigServiceMock(applicationConfigMock),
        provideAuthFacadeServiceMock(authFacadeMock),
        provideAuthOrchestratorServiceMock(authOrchestratorServiceMock),
        provideBreakpointObserverMock(breakpointObserverMock),
      ],
    }).compileComponents();
  });

  it('should initialize form with otp length from config', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component.otpLength).toBe(applicationConfigMock.otp.length);

    const otpControl = component.form.controls.otp;

    otpControl.setValue('A'.repeat(component.otpLength + 1));
    expect(otpControl.valid).toBe(false);

    otpControl.setValue('A'.repeat(component.otpLength));
    expect(otpControl.valid).toBe(true);
  });

  it.each<[boolean, boolean, string]>([
    [true, true, 'auth.login.buttons.signIn'],
    [true, false, 'auth.login.buttons.continue'],
    [false, false, 'auth.register.buttons.continue'],
  ])('should compute submitLabel for isLogin=%s showPassword=%s', (isLogin, showPassword, expected) => {
    const fixture = createComponent();
    fixture.componentRef.setInput('isLogin', isLogin);
    fixture.componentRef.setInput('showPassword', showPassword);

    expect(fixture.componentInstance.submitLabel()).toBe(expected);
  });

  it('should compute dividerLabel based on isLogin', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component.dividerLabel()).toBe('auth.login.texts.or');

    fixture.componentRef.setInput('isLogin', false);
    expect(component.dividerLabel()).toBe('auth.register.texts.or');
  });

  it('should not call submitHandler when form is invalid', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const submitHandler = vi.fn(async () => true);
    fixture.componentRef.setInput('submitHandler', submitHandler);

    component.form.controls.email.setValue('invalid-email');
    expect(component.form.invalid).toBe(true);

    await component.onSubmit();

    expect(submitHandler).not.toHaveBeenCalled();
    expect(component.submitError()).toBe(false);
  });

  it('should call submitHandler and reset form on successful submit', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const submitHandler = vi.fn(async () => true);
    fixture.componentRef.setInput('submitHandler', submitHandler);

    const email = 'success@example.com';
    const testPwd = 'test-password';

    component.form.controls.email.setValue(email);
    component.form.controls.password.setValue(testPwd);
    expect(component.form.valid).toBe(true);

    component.submitError.set(true);

    await component.onSubmit();

    expect(submitHandler).toHaveBeenCalledExactlyOnceWith(email, testPwd);
    expect(component.submitError()).toBe(false);
    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.password.value).toBeNull();
    expect(component.form.controls.otp.value).toBeNull();
  });

  it.each<['returns false' | 'throws', () => Promise<boolean>]>([
    ['returns false', async () => false],
    [
      'throws',
      async () => {
        throw new Error('submit failed');
      },
    ],
  ])('should set submitError and keep values when submitHandler %s', async (_desc, handler) => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const submitHandler = vi.fn(handler);
    fixture.componentRef.setInput('submitHandler', submitHandler);

    component.form.controls.email.setValue('fail@example.com');
    component.form.controls.password.setValue('test-password');

    await component.onSubmit();

    expect(submitHandler).toHaveBeenCalledOnce();
    expect(component.submitError()).toBe(true);
    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.email.value).toBe('fail@example.com');
    expect(component.form.controls.password.value).toBe('test-password');
  });
});
