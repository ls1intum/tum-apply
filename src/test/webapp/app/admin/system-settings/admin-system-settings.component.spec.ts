import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AdminSystemSettingsComponent } from 'app/admin/system-settings/admin-system-settings.component';
import { AiFeatureToggleResourceApi } from 'app/generated/api/ai-feature-toggle-resource-api';
import { AiFeatureStatusDTO } from 'app/generated/model/ai-feature-status-dto';
import { provideTranslateMock, createTranslateServiceMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';

describe('AdminSystemSettingsComponent', () => {
  let component: AdminSystemSettingsComponent;
  let fixture: ComponentFixture<AdminSystemSettingsComponent>;
  let mockApi: {
    getAiStatus: ReturnType<typeof vi.fn>;
    toggleAi: ReturnType<typeof vi.fn>;
    resetCircuitBreaker: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ToastServiceMock;

  const enabledStatus: AiFeatureStatusDTO = {
    aiEnabled: true,
    manuallyDisabled: false,
    circuitBreakerOpen: false,
  };

  const disabledStatus: AiFeatureStatusDTO = {
    aiEnabled: false,
    manuallyDisabled: true,
    circuitBreakerOpen: false,
  };

  const circuitBreakerOpenStatus: AiFeatureStatusDTO = {
    aiEnabled: false,
    manuallyDisabled: false,
    circuitBreakerOpen: true,
  };

  beforeEach(async () => {
    mockApi = {
      getAiStatus: vi.fn(),
      toggleAi: vi.fn(),
      resetCircuitBreaker: vi.fn(),
    };

    mockToastService = createToastServiceMock();

    mockApi.getAiStatus.mockReturnValue(of(enabledStatus));

    await TestBed.configureTestingModule({
      imports: [AdminSystemSettingsComponent],
      providers: [
        { provide: AiFeatureToggleResourceApi, useValue: mockApi },
        provideTranslateMock(createTranslateServiceMock()),
        provideToastServiceMock(mockToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSystemSettingsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading Status', () => {
    it('should fetch AI status on construction', async () => {
      await Promise.resolve();

      expect(mockApi.getAiStatus).toHaveBeenCalledOnce();
      expect(component.aiStatus()).toEqual(enabledStatus);
    });

    it('should show error toast when loading fails', async () => {
      mockApi.getAiStatus.mockReturnValue(throwError(() => new Error('Network error')));

      await component.loadStatus();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('systemSettings.ai.toast.loadError');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Computed Signals', () => {
    it('should derive aiEnabled from status', async () => {
      await Promise.resolve();

      expect(component.aiEnabled()).toBe(true);
    });

    it('should derive manuallyDisabled from status', async () => {
      mockApi.getAiStatus.mockReturnValue(of(disabledStatus));
      await component.loadStatus();

      expect(component.manuallyDisabled()).toBe(true);
    });

    it('should derive circuitBreakerOpen from status', async () => {
      mockApi.getAiStatus.mockReturnValue(of(circuitBreakerOpenStatus));
      await component.loadStatus();

      expect(component.circuitBreakerOpen()).toBe(true);
    });

    it('should default to safe values when status is undefined', () => {
      component.aiStatus.set(undefined);

      expect(component.aiEnabled()).toBe(true);
      expect(component.manuallyDisabled()).toBe(false);
      expect(component.circuitBreakerOpen()).toBe(false);
    });
  });

  describe('Toggle AI', () => {
    it('should disable AI and show success toast', async () => {
      mockApi.toggleAi.mockReturnValue(of(disabledStatus));

      await component.onAiToggleChanged(false);

      expect(mockApi.toggleAi).toHaveBeenCalledWith(false);
      expect(component.aiStatus()).toEqual(disabledStatus);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('systemSettings.ai.toast.disabled');
    });

    it('should enable AI and show success toast', async () => {
      mockApi.toggleAi.mockReturnValue(of(enabledStatus));

      await component.onAiToggleChanged(true);

      expect(mockApi.toggleAi).toHaveBeenCalledWith(true);
      expect(component.aiStatus()).toEqual(enabledStatus);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('systemSettings.ai.toast.enabled');
    });

    it('should show error toast when toggle fails', async () => {
      mockApi.toggleAi.mockReturnValue(throwError(() => new Error('API error')));

      await component.onAiToggleChanged(false);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('systemSettings.ai.toast.toggleError');
    });

  });

  describe('Reset Circuit Breaker', () => {
    it('should reset circuit breaker and show success toast', async () => {
      mockApi.resetCircuitBreaker.mockReturnValue(of(enabledStatus));

      await component.resetCircuitBreaker();

      expect(mockApi.resetCircuitBreaker).toHaveBeenCalledOnce();
      expect(component.aiStatus()).toEqual(enabledStatus);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('systemSettings.ai.toast.circuitBreakerReset');
    });

    it('should show error toast when reset fails', async () => {
      mockApi.resetCircuitBreaker.mockReturnValue(throwError(() => new Error('API error')));

      await component.resetCircuitBreaker();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('systemSettings.ai.toast.resetError');
    });

  });
});
