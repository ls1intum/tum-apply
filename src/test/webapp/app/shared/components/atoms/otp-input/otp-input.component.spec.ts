import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

import { OtpInput } from 'app/shared/components/atoms/otp-input/otp-input';
import {
  ApplicationConfigServiceMock,
  createApplicationConfigServiceMock,
  provideApplicationConfigServiceMock,
} from '../../../../../util/application-config.service.mock';
import {
  AuthFacadeServiceMock,
  createAuthFacadeServiceMock,
  provideAuthFacadeServiceMock,
} from '../../../../../util/auth-facade.service.mock';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

import {
  AuthOrchestratorServiceMock,
  createAuthOrchestratorServiceMock,
  provideAuthOrchestratorServiceMock,
} from '../../../../../util/auth-orchestrator.service.mock';

describe('OtpInput', () => {
  let applicationConfigMock: ApplicationConfigServiceMock;
  let authFacadeMock: AuthFacadeServiceMock;
  let authOrchestratorServiceMock: AuthOrchestratorServiceMock;
  let dynamicDialogConfigMock: DynamicDialogConfig;
  let breakpointState: Record<string, boolean>;

  const getIsRegistration = (component: OtpInput): boolean => ((component as any).isRegistration as () => boolean)();

  const getFormControl = (component: OtpInput) => (component as any).formControl();

  function createComponent() {
    const fixture = TestBed.createComponent(OtpInput);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    applicationConfigMock = createApplicationConfigServiceMock({
      otp: {
        length: 6,
        ttlSeconds: 90,
        resendCooldownSeconds: 60,
      },
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    authFacadeMock = createAuthFacadeServiceMock();
    authOrchestratorServiceMock = createAuthOrchestratorServiceMock();
    breakpointState = {
      [Breakpoints.XLarge]: false,
      [Breakpoints.XSmall]: false,
      [Breakpoints.Small]: false,
    };
    dynamicDialogConfigMock = { data: {} } as DynamicDialogConfig;

    await TestBed.configureTestingModule({
      imports: [OtpInput],
      providers: [
        provideFontAwesomeTesting(),
        provideTranslateMock(),
        provideApplicationConfigServiceMock(applicationConfigMock),
        provideAuthFacadeServiceMock(authFacadeMock),
        provideAuthOrchestratorServiceMock(authOrchestratorServiceMock),
        { provide: DynamicDialogConfig, useValue: dynamicDialogConfigMock },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => of({ breakpoints: breakpointState }),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create with default configuration and compute ttlMinutes', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.length).toBe(applicationConfigMock.otp.length);
    expect(component.ttlMinutes).toBe(Math.max(1, Math.ceil(applicationConfigMock.otp.ttlSeconds / 60)));
  });

  it('should determine otpSize based on breakpoints (large / small / null)', () => {
    breakpointState[Breakpoints.XLarge] = true;
    breakpointState[Breakpoints.XSmall] = false;
    breakpointState[Breakpoints.Small] = false;
    const largeFixture = createComponent();
    expect(largeFixture.componentInstance.otpSize()).toBe('large');

    breakpointState[Breakpoints.XLarge] = false;
    breakpointState[Breakpoints.XSmall] = true;
    breakpointState[Breakpoints.Small] = false;
    const smallFixture = createComponent();
    expect(smallFixture.componentInstance.otpSize()).toBe('small');

    breakpointState[Breakpoints.XLarge] = false;
    breakpointState[Breakpoints.XSmall] = false;
    breakpointState[Breakpoints.Small] = false;
    const defaultFixture = createComponent();
    expect(defaultFixture.componentInstance.otpSize()).toBeNull();
  });

  it('should prefer registration flag from DynamicDialogConfig over input', () => {
    dynamicDialogConfigMock.data = { registration: true };
    const fixture = createComponent();
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('registration', false);
    fixture.detectChanges();

    expect(getIsRegistration(component)).toBe(true);
  });

  it('should derive registration from @Input when no override is provided', () => {
    dynamicDialogConfigMock.data = {};
    const fixture = createComponent();
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('registration', true);
    fixture.detectChanges();

    expect(getIsRegistration(component)).toBe(true);
  });

  it('should handle missing dialog data without overriding registration input', () => {
    (dynamicDialogConfigMock as any).data = undefined;

    const fixture = createComponent();
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('registration', true);
    fixture.detectChanges();

    expect(getIsRegistration(component)).toBe(true);
  });

  it('should normalize OTP input and mark control as dirty for non-empty value', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const otpEvent = { value: 'a1$' } as any;
    component.onChange(otpEvent);
    fixture.detectChanges();

    const ctrl = getFormControl(component);
    expect(component.otpValue()).toBe('A1');
    expect(ctrl.value).toBe('A1');
    expect(ctrl.dirty).toBe(true);
    expect(ctrl.pristine).toBe(false);
  });

  it('should reset OTP and mark control as pristine for empty value', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.onChange({ value: 'abc' } as any);
    fixture.detectChanges();

    component.onChange({ value: undefined } as any);
    fixture.detectChanges();

    const ctrl = getFormControl(component);
    expect(component.otpValue()).toBe('');
    expect(ctrl.value).toBe('');
    expect(ctrl.pristine).toBe(true);
  });

  it('should clear error and not call verifyOtp when submit is disabled', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const clearSpy = vi.spyOn(authOrchestratorServiceMock, 'clearError');

    component.onSubmit();

    expect(clearSpy).toHaveBeenCalled();
    expect(authFacadeMock.verifyOtp).not.toHaveBeenCalled();
  });

  it('should submit OTP and call verifyOtp when form is valid', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const otp = 'ABC123';
    component.onChange({ value: otp } as any);
    fixture.detectChanges();

    const registrationFlagBefore = getIsRegistration(component);

    const clearSpy = vi.spyOn(authOrchestratorServiceMock, 'clearError');

    component.onSubmit();

    expect(clearSpy).toHaveBeenCalled();
    expect(authFacadeMock.verifyOtp).toHaveBeenCalledWith(otp, registrationFlagBefore);
  });

  it('should trigger submit when pressing Enter key and prevent default', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const submitSpy = vi.spyOn(component, 'onSubmit');
    const preventDefault = vi.fn();

    component.onKeyDown({ key: 'Enter', preventDefault } as any);

    expect(preventDefault).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalled();
  });

  it('should allow non-character keys like Backspace without preventing default', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const preventDefault = vi.fn();
    component.onKeyDown({ key: 'Backspace', preventDefault } as any);

    // Backspace has key.length > 1 and should not be prevented
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should block non-alphanumeric single-character keys', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const preventDefault = vi.fn();
    component.onKeyDown({ key: '@', preventDefault } as any);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should allow alphanumeric keys without preventing default', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const preventDefault = vi.fn();
    component.onKeyDown({ key: 'A', preventDefault } as any);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should not resend OTP when disableResend is true (busy or cooldown)', () => {
    authOrchestratorServiceMock.isBusySignal.set(true);
    authOrchestratorServiceMock.cooldownSecondsSignal.set(10);

    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.onResend();

    expect(authFacadeMock.requestOtp).not.toHaveBeenCalled();
  });

  it('should resend OTP, clear errors and reset value when allowed', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.onChange({ value: 'ABC123' } as any);
    fixture.detectChanges();

    const registrationFlagBefore = getIsRegistration(component);

    const clearSpy = vi.spyOn(authOrchestratorServiceMock, 'clearError');

    component.onResend();

    const ctrl = getFormControl(component);
    expect(component.otpValue()).toBe('');
    expect(ctrl.value).toBe('');
    expect(ctrl.pristine).toBe(true);
    expect(clearSpy).toHaveBeenCalled();
    expect(authFacadeMock.requestOtp).toHaveBeenCalledWith(registrationFlagBefore);
  });

  it('should compute disableResend and disabledSubmit for initial state', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.disableResend()).toBe(false);
    expect(component.disabledSubmit()).toBe(true);
  });

  it('should set disableResend to true when orchestrator is busy', () => {
    authOrchestratorServiceMock.isBusySignal.set(true);

    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.disableResend()).toBe(true);
    expect(component.disabledSubmit()).toBe(true);
  });

  it('should allow submit when OTP length is correct even if an error is present', () => {
    authOrchestratorServiceMock.isBusySignal.set(false);
    authOrchestratorServiceMock.errorSignal.set({ message: 'error' } as any);

    const fixture = createComponent();
    const component = fixture.componentInstance;

    // Error does not keep submit disabled when length is valid
    component.onChange({ value: 'ABC123' } as any);
    fixture.detectChanges();

    expect(component.disabledSubmit()).toBe(false);
  });

  it('should use default resend label when not on cooldown', () => {
    authOrchestratorServiceMock.cooldownSecondsSignal.set(0);

    const fixture = createComponent();
    const component = fixture.componentInstance;

    const labelWithoutCooldown = component.resendLabel;
    expect(labelWithoutCooldown).toBeTruthy();
  });

  it('should use cooldown resend label when on cooldown', () => {
    authOrchestratorServiceMock.cooldownSecondsSignal.set(10);

    const fixture = createComponent();
    const component = fixture.componentInstance;

    const labelWithCooldown = component.resendLabel;
    expect(labelWithCooldown).toBeTruthy();
  });

  it('should wire template events correctly (OTP change, Enter key, and button clicks)', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const otpHost = fixture.debugElement.query(By.css('p-inputotp'));
    expect(otpHost).toBeTruthy();

    otpHost.triggerEventHandler('onChange', { value: 'abc123' });
    fixture.detectChanges();
    expect(component.otpValue()).toBe('ABC123');

    const submitSpy = vi.spyOn(component, 'onSubmit');
    const preventDefault = vi.fn();
    otpHost.triggerEventHandler('keydown', { key: 'Enter', preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalled();

    const buttons = fixture.debugElement.queryAll(By.css('jhi-button'));
    const resendButton = buttons[0];
    const submitButton = buttons[1];

    expect(resendButton).toBeTruthy();
    expect(submitButton).toBeTruthy();

    submitButton.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    expect(authFacadeMock.verifyOtp).toHaveBeenCalled();

    resendButton.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    expect(authFacadeMock.requestOtp).toHaveBeenCalled();
  });
});
