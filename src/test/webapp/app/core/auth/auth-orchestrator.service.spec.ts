import { TestBed } from '@angular/core/testing';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { vi } from 'vitest';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from '../../../util/toast-service.mock';

class MockApplicationConfigService {
  otp = { resendCooldownSeconds: 30 };
}

describe('AuthOrchestratorService', () => {
  let service: AuthOrchestratorService;
  let toastService: ToastServiceMock;

  beforeEach(() => {
    toastService = createToastServiceMock();

    TestBed.configureTestingModule({
      providers: [
        AuthOrchestratorService,
        {
          provide: ApplicationConfigService,
          useClass: MockApplicationConfigService,
        },
        provideToastServiceMock(toastService),
      ],
    });
    service = TestBed.inject(AuthOrchestratorService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should open with prefill data', () => {
    service.open({ prefill: { email: 'foo@bar.com', firstName: 'Foo', lastName: 'Bar' } });
    expect(service.email()).toBe('foo@bar.com');
    expect(service.firstName()).toBe('Foo');
    expect(service.lastName()).toBe('Bar');
    expect(service.isOpen()).toBe(true);
  });

  it('should call onSuccess callback and close on authSuccess', () => {
    const cb = vi.fn();
    service.open({ onSuccess: cb });
    service.authSuccess();
    expect(service.isOpen()).toBe(false);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('should go to nextStep in login flow', () => {
    service.switchToLogin();
    service.nextStep('otp');
    expect(service.loginStep()).toBe('otp');
  });

  it('should go to previousStep in login flow', () => {
    service.switchToLogin();
    service.nextStep('otp');
    service.previousStep();
    expect(service.loginStep()).toBe('email');
  });

  it('should close dialog if nextStep called at end of register flow', () => {
    service.switchToRegister();
    service.registerStep.set('password');
    service.nextStep();
    expect(service.isOpen()).toBe(false);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open and close the dialog', () => {
    service.open();
    expect(service.isOpen()).toBe(true);
    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it('should switch between login and register modes', () => {
    service.switchToRegister();
    expect(service.mode()).toBe('register');
    service.switchToLogin();
    expect(service.mode()).toBe('login');
  });

  it('should set and clear error', () => {
    service.setError({ summary: 'Test error' });
    expect(service.error()).toStrictEqual({ summary: 'Test error' });
    service.clearError();
    expect(service.error()).toBeNull();
  });

  it('should go to next and previous steps in register', () => {
    service.switchToRegister();
    const initialStep = service.registerStep();
    service.nextStep();
    expect(service.registerStep()).not.toBe(initialStep);
    service.previousStep();
    expect(service.registerStep()).toBe(initialStep);
  });

  it('should start OTP cooldown', () => {
    service['startOtpRefreshCooldown']();
    expect(service.cooldownUntil()).not.toBeNull();
    expect(service.cooldownSeconds()).toBeGreaterThan(0);
  });
});
