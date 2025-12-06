import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CredentialsGroupComponent } from 'app/shared/components/molecules/credentials-group/credentials-group.component';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { of } from 'rxjs';

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
  let breakpointObserverMock: { observe: ReturnType<typeof vi.fn> };

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

    breakpointObserverMock = {
      observe: vi.fn(() =>
        of({
          breakpoints: {
            [Breakpoints.XSmall]: false,
            [Breakpoints.Small]: false,
          },
          matches: false,
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CredentialsGroupComponent],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideApplicationConfigServiceMock(applicationConfigMock),
        provideAuthFacadeServiceMock(authFacadeMock),
        provideAuthOrchestratorServiceMock(authOrchestratorServiceMock),
        {
          provide: BreakpointObserver,
          useValue: breakpointObserverMock,
        },
      ],
    }).compileComponents();
  });

  it('should create component and initialize form with otp length from config', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component.otpLength).toBe(applicationConfigMock.otp.length);

    const otpControl = component.form.controls.otp;

    otpControl.setValue('A'.repeat(component.otpLength + 1));
    expect(otpControl.valid).toBe(false);

    otpControl.setValue('A'.repeat(component.otpLength));
    expect(otpControl.valid).toBe(true);
  });

  it('should compute submitLabel for login with password', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('isLogin', true);
    fixture.componentRef.setInput('showPassword', true);

    expect(component.submitLabel()).toBe('auth.login.buttons.signIn');
  });

  it('should compute submitLabel for login without password', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('isLogin', true);
    fixture.componentRef.setInput('showPassword', false);

    expect(component.submitLabel()).toBe('auth.login.buttons.continue');
  });

  it('should compute submitLabel for registration', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('isLogin', false);

    expect(component.submitLabel()).toBe('auth.register.buttons.continue');
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

    expect(submitHandler).toHaveBeenCalledWith(email, testPwd);
    expect(component.submitError()).toBe(false);
    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.password.value).toBeNull();
    expect(component.form.controls.otp.value).toBeNull();
  });

  it('should set submitError and keep values when submitHandler returns false', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const submitHandler = vi.fn(async () => false);
    fixture.componentRef.setInput('submitHandler', submitHandler);

    const email = 'fail@example.com';
    const testPwd = 'test-password';

    component.form.controls.email.setValue(email);
    component.form.controls.password.setValue(testPwd);
    expect(component.form.valid).toBe(true);

    await component.onSubmit();

    expect(submitHandler).toHaveBeenCalledWith(email, testPwd);
    expect(component.submitError()).toBe(true);
    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.email.value).toBe(email);
    expect(component.form.controls.password.value).toBe(testPwd);
  });

  it('should set submitError and mark form as pristine when submitHandler throws', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const submitHandler = vi.fn(async () => {
      throw new Error('submit failed');
    });
    fixture.componentRef.setInput('submitHandler', submitHandler);

    const email = 'error@example.com';
    const testPwd = 'test-password';

    component.form.controls.email.setValue(email);
    component.form.controls.password.setValue(testPwd);
    expect(component.form.valid).toBe(true);

    await component.onSubmit();

    expect(submitHandler).toHaveBeenCalledWith(email, testPwd);
    expect(component.submitError()).toBe(true);
    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.email.value).toBe(email);
    expect(component.form.controls.password.value).toBe(testPwd);
  });
});
