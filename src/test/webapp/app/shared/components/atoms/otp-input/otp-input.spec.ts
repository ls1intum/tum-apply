import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OtpInput } from 'app/shared/components/atoms/otp-input/otp-input';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { InputOtpChangeEvent } from 'primeng/inputotp';

describe('OtpInput', () => {
  let mockApplicationConfigService: any;
  let mockAuthOrchestratorService: any;
  let mockAuthFacadeService: any;
  let translateService: TranslateService;
  let mockDynamicDialogConfig: any;
  let mockBreakpointObserver: any;

  beforeEach(async () => {
    mockApplicationConfigService = {
      otp: {
        length: 6,
        ttlSeconds: 300,
      },
    };

    mockAuthOrchestratorService = {
      cooldownSeconds: signal(0),
      isBusy: signal(false),
      error: signal(null),
      clearError: vi.fn(),
    };

    mockAuthFacadeService = {
      verifyOtp: vi.fn(),
      requestOtp: vi.fn(),
    };

    mockDynamicDialogConfig = {
      data: {},
    };

    mockBreakpointObserver = {
      observe: vi.fn(() =>
        of({
          matches: false,
          breakpoints: {
            [Breakpoints.XSmall]: false,
            [Breakpoints.Small]: false,
            [Breakpoints.XLarge]: false,
          },
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [OtpInput, ReactiveFormsModule],
      providers: [
        provideFontAwesomeTesting(),
        provideTranslateMock(),
        { provide: ApplicationConfigService, useValue: mockApplicationConfigService },
        { provide: AuthOrchestratorService, useValue: mockAuthOrchestratorService },
        { provide: AuthFacadeService, useValue: mockAuthFacadeService },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    vi.spyOn(translateService, 'instant').mockImplementation((key: string | string[], params?: any) => {
      if (key === 'auth.common.otp.resendCooldown') {
        return `Resend in ${params?.seconds} seconds`;
      }
      if (key === 'auth.common.otp.resend') {
        return 'Resend OTP';
      }
      return typeof key === 'string' ? key : key.join('.');
    });
  });

  function createFixture() {
    const fixture = TestBed.createComponent(OtpInput);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.length).toBe(6);
    expect(comp.ttlSeconds).toBe(300);
    expect(comp.ttlMinutes).toBe(5);
    expect(comp.otpValue()).toBe('');
    expect(comp.registration()).toBe(false);
  });

  it('should set registration from input', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('registration', true);

    const comp = fixture.componentInstance;
    expect(comp.registration()).toBe(true);
  });

  it('should override registration from DynamicDialogConfig', () => {
    mockDynamicDialogConfig.data = { registration: true };
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp['registrationOverride']()).toBe(true);
  });

  it('should calculate ttlMinutes correctly', () => {
    mockApplicationConfigService.otp.ttlSeconds = 120;
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.ttlMinutes).toBe(2);
  });

  it('should calculate ttlMinutes as minimum 1 for small values', () => {
    mockApplicationConfigService.otp.ttlSeconds = 30;
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.ttlMinutes).toBe(1);
  });

  it('should compute cooldownSeconds from authOrchestratorService', () => {
    mockAuthOrchestratorService.cooldownSeconds.set(10);
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.cooldownSeconds()).toBe(10);
  });

  it('should compute onCooldown based on cooldownSeconds', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.cooldownSeconds.set(0);
    expect(comp.onCooldown()).toBe(false);

    mockAuthOrchestratorService.cooldownSeconds.set(5);
    expect(comp.onCooldown()).toBe(true);
  });

  it('should compute isBusy from authOrchestratorService', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    expect(comp.isBusy()).toBe(false);

    mockAuthOrchestratorService.isBusy.set(true);
    expect(comp.isBusy()).toBe(true);
  });

  it('should compute showError from authOrchestratorService', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.error.set(null);
    expect(comp.showError()).toBe(false);

    mockAuthOrchestratorService.error.set({ message: 'Error' });
    expect(comp.showError()).toBe(true);
  });

  it('should compute disableResend when busy', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(true);
    mockAuthOrchestratorService.cooldownSeconds.set(0);
    expect(comp.disableResend()).toBe(true);
  });

  it('should compute disableResend when on cooldown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.cooldownSeconds.set(10);
    expect(comp.disableResend()).toBe(true);
  });

  it('should compute disableResend as false when not busy and not on cooldown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.cooldownSeconds.set(0);
    expect(comp.disableResend()).toBe(false);
  });

  it('should compute disabledSubmit when showError is true', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.error.set({ message: 'Error' });
    expect(comp.disabledSubmit()).toBe(true);
  });

  it('should compute disabledSubmit when busy', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(true);
    comp.otpValue.set('123456');
    expect(comp.disabledSubmit()).toBe(true);
  });

  it('should compute disabledSubmit when OTP length is incorrect', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.error.set(null);
    comp.otpValue.set('123');
    expect(comp.disabledSubmit()).toBe(true);
  });

  it('should compute disabledSubmit as false when all conditions are met', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.error.set(null);
    comp.otpValue.set('123456');
    expect(comp.disabledSubmit()).toBe(false);
  });

  it('should return correct resend label when not on cooldown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.cooldownSeconds.set(0);
    expect(comp.resendLabel).toBe('Resend OTP');
  });

  it('should return correct resend label when on cooldown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.cooldownSeconds.set(15);
    expect(comp.resendLabel).toBe('Resend in 15 seconds');
  });

  it('should handle onChange and normalize input', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);
    const emitSpy = vi.spyOn(comp.modelChange, 'emit');

    const event: InputOtpChangeEvent = { value: 'abc123', originalEvent: new Event('input') };
    comp.onChange(event);

    expect(comp.otpValue()).toBe('ABC123');
    expect(emitSpy).toHaveBeenCalledWith('ABC123');
    expect(mockCtrl.value).toBe('ABC123');
    expect(mockAuthOrchestratorService.clearError).toHaveBeenCalled();
  });

  it('should strip non-alphanumeric characters in onChange', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    const event: InputOtpChangeEvent = { value: 'a@b#1$2', originalEvent: new Event('input') };
    comp.onChange(event);

    expect(comp.otpValue()).toBe('AB12');
  });

  it('should handle onChange with undefined value', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    const event: InputOtpChangeEvent = { value: undefined, originalEvent: new Event('input') };
    comp.onChange(event);

    expect(comp.otpValue()).toBe('');
  });

  it('should handle onSubmit when valid', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.error.set(null);
    comp.otpValue.set('123456');
    fixture.componentRef.setInput('registration', false);

    comp.onSubmit();

    expect(mockAuthOrchestratorService.clearError).toHaveBeenCalled();
    expect(mockAuthFacadeService.verifyOtp).toHaveBeenCalledWith('123456', false);
  });

  it('should handle onSubmit for registration', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.error.set(null);
    comp.otpValue.set('ABC123');
    fixture.componentRef.setInput('registration', true);

    comp.onSubmit();

    expect(mockAuthFacadeService.verifyOtp).toHaveBeenCalledWith('ABC123', true);
  });

  it('should not call verifyOtp when submit is disabled', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.error.set(null);
    comp.otpValue.set('123'); // Invalid length

    comp.onSubmit();

    expect(mockAuthFacadeService.verifyOtp).not.toHaveBeenCalled();
  });

  it('should handle onResend when enabled', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('initial');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.cooldownSeconds.set(0);
    comp.otpValue.set('123456');
    fixture.componentRef.setInput('registration', false);

    comp.onResend();

    expect(mockAuthOrchestratorService.clearError).toHaveBeenCalled();
    expect(comp.otpValue()).toBe('');
    expect(mockCtrl.value).toBe('');
    expect(mockCtrl.pristine).toBe(true);
    expect(mockAuthFacadeService.requestOtp).toHaveBeenCalledWith(false);
  });

  it('should handle onResend for registration', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.cooldownSeconds.set(0);
    fixture.componentRef.setInput('registration', true);

    comp.onResend();

    expect(mockAuthFacadeService.requestOtp).toHaveBeenCalledWith(true);
  });

  it('should not call requestOtp when resend is disabled', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(true);

    comp.onResend();

    expect(mockAuthFacadeService.requestOtp).not.toHaveBeenCalled();
  });

  it('should handle onKeyDown Enter key', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const submitSpy = vi.spyOn(comp, 'onSubmit');

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    comp.onKeyDown(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalled();
  });

  it('should block non-alphanumeric keys in onKeyDown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    const event = new KeyboardEvent('keydown', { key: '@' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    comp.onKeyDown(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should allow alphanumeric keys in onKeyDown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    const eventA = new KeyboardEvent('keydown', { key: 'A' });
    const preventDefaultSpyA = vi.spyOn(eventA, 'preventDefault');
    comp.onKeyDown(eventA);
    expect(preventDefaultSpyA).not.toHaveBeenCalled();

    const event5 = new KeyboardEvent('keydown', { key: '5' });
    const preventDefaultSpy5 = vi.spyOn(event5, 'preventDefault');
    comp.onKeyDown(event5);
    expect(preventDefaultSpy5).not.toHaveBeenCalled();
  });

  it('should allow navigation keys in onKeyDown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    const event = new KeyboardEvent('keydown', { key: 'Backspace' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    comp.onKeyDown(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should mark form control as dirty when setting non-empty value', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    comp['setValue']('123456');

    expect(mockCtrl.dirty).toBe(true);
    expect(mockCtrl.pristine).toBe(false);
  });

  it('should mark form control as pristine when setting empty value', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('test');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    comp['setValue']('');

    expect(mockCtrl.pristine).toBe(true);
    expect(mockCtrl.dirty).toBe(false);
  });

  it('should compute otpSize as small for XSmall breakpoint', () => {
    mockBreakpointObserver.observe.mockReturnValue(
      of({
        matches: true,
        breakpoints: {
          [Breakpoints.XSmall]: true,
          [Breakpoints.Small]: false,
          [Breakpoints.XLarge]: false,
        },
      }),
    );

    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.otpSize()).toBe('small');
  });

  it('should compute otpSize as large for XLarge breakpoint', () => {
    mockBreakpointObserver.observe.mockReturnValue(
      of({
        matches: true,
        breakpoints: {
          [Breakpoints.XSmall]: false,
          [Breakpoints.Small]: false,
          [Breakpoints.XLarge]: true,
        },
      }),
    );

    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.otpSize()).toBe('large');
  });

  it('should compute otpSize as null for medium breakpoint', () => {
    mockBreakpointObserver.observe.mockReturnValue(
      of({
        matches: false,
        breakpoints: {
          [Breakpoints.XSmall]: false,
          [Breakpoints.Small]: false,
          [Breakpoints.XLarge]: false,
        },
      }),
    );

    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.otpSize()).toBe(null);
  });

  it('should update form control validity when setting value', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    const updateValiditySpy = vi.spyOn(mockCtrl, 'updateValueAndValidity');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    comp['setValue']('123456');

    expect(updateValiditySpy).toHaveBeenCalled();
  });

  it('should emit modelChange when setting value', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);
    const emitSpy = vi.spyOn(comp.modelChange, 'emit');

    comp['setValue']('ABC123');

    expect(emitSpy).toHaveBeenCalledWith('ABC123');
  });
});
