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

interface AuthOrchestratorStub {
  cooldownSeconds: ReturnType<typeof signal<number>>;
  isBusy: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string | null>>;
  clearError: () => void;
}

interface AuthFacadeStub {
  verifyOtp: (code: string, registration: boolean) => unknown;
  requestOtp: (registration: boolean) => unknown;
}

describe('OtpInput', () => {
  let mockApplicationConfigService: { otp: { length: number; ttlSeconds: number } };
  let mockAuthOrchestratorService: AuthOrchestratorStub;
  let mockAuthFacadeService: AuthFacadeStub;
  let translateService: TranslateService;
  let mockDynamicDialogConfig: DynamicDialogConfig;
  let mockBreakpointObserver: { observe: ReturnType<typeof vi.fn> };

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
      error: signal<string | null>(null),
      clearError: vi.fn(),
    };

    mockAuthFacadeService = {
      verifyOtp: vi.fn(),
      requestOtp: vi.fn(),
    };

    mockDynamicDialogConfig = { data: {} } as DynamicDialogConfig;

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
        { provide: ApplicationConfigService, useValue: mockApplicationConfigService as unknown as ApplicationConfigService },
        { provide: AuthOrchestratorService, useValue: mockAuthOrchestratorService as unknown as AuthOrchestratorService },
        { provide: AuthFacadeService, useValue: mockAuthFacadeService as unknown as AuthFacadeService },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver as unknown as BreakpointObserver },
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

  it('should compute disableResend when busy or on cooldown', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.isBusy.set(true);
    mockAuthOrchestratorService.cooldownSeconds.set(0);
    expect(comp.disableResend()).toBe(true);

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.cooldownSeconds.set(10);
    expect(comp.disableResend()).toBe(true);

    mockAuthOrchestratorService.isBusy.set(false);
    mockAuthOrchestratorService.cooldownSeconds.set(0);
    expect(comp.disableResend()).toBe(false);
  });

  it('should compute disabledSubmit correctly', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.error.set('Error');
    expect(comp.disabledSubmit()).toBe(true);

    mockAuthOrchestratorService.error.set(null);
    mockAuthOrchestratorService.isBusy.set(false);
    comp.otpValue.set('123');
    expect(comp.disabledSubmit()).toBe(true);

    comp.otpValue.set('123456');
    expect(comp.disabledSubmit()).toBe(false);
  });

  it('should return correct resend label', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    mockAuthOrchestratorService.cooldownSeconds.set(0);
    expect(comp.resendLabel).toBe('Resend OTP');

    mockAuthOrchestratorService.cooldownSeconds.set(15);
    expect(comp.resendLabel).toBe('Resend in 15 seconds');
  });

  it('should handle onChange and normalize input', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);
    const emitSpy = vi.spyOn(comp.modelChange, 'emit');

    const event: InputOtpChangeEvent = { value: 'a@b#1$2', originalEvent: new Event('input') };
    comp.onChange(event);

    expect(comp.otpValue()).toBe('AB12');
    expect(emitSpy).toHaveBeenCalledWith('AB12');
    expect(mockCtrl.value).toBe('AB12');
    expect(mockAuthOrchestratorService.clearError).toHaveBeenCalled();
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

  it('should compute otpSize based on breakpoint', () => {
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
    expect(fixture.componentInstance.otpSize()).toBe('small');
  });
});
