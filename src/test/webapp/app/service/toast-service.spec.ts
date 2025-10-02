import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MessageService } from 'primeng/api';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { ToastService } from 'app/service/toast-service';
import { ApplicationRef, EnvironmentInjector } from '@angular/core';

describe('ToastService', () => {
  let service: ToastService;
  let messageService: MessageService;
  let appRef: ApplicationRef;
  let envInjector: EnvironmentInjector;
  let translateMock: ReturnType<typeof createTranslateServiceMock>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService, MessageService, provideTranslateMock()],
    });

    service = TestBed.inject(ToastService);
    messageService = TestBed.inject(MessageService);
    appRef = TestBed.inject(ApplicationRef);
    envInjector = TestBed.inject(EnvironmentInjector);
    translateMock = TestBed.inject(TranslateService) as ReturnType<typeof createTranslateServiceMock>;

    vi.spyOn(messageService, 'add');
    vi.spyOn(translateMock, 'instant');

    document.body.querySelectorAll('jhi-toast').forEach(el => el.remove());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have all required methods', () => {
    expect(service.showSuccess).toBeDefined();
    expect(service.showError).toBeDefined();
    expect(service.showInfo).toBeDefined();
    expect(service.showWarn).toBeDefined();
    expect(service.showSuccessKey).toBeDefined();
    expect(service.showErrorKey).toBeDefined();
    expect(service.showInfoKey).toBeDefined();
    expect(service.showWarnKey).toBeDefined();
  });

  describe('showSuccess', () => {
    it('should call messageService.add with success severity', () => {
      const message = {
        summary: 'Success',
        detail: 'Operation completed successfully',
      };

      service.showSuccess(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed successfully',
      });
    });

    it('should handle message with life property', () => {
      service.showSuccess({ summary: 'Success', detail: 'Details', life: 5000 });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Details',
        life: 5000,
      });
    });

    it('should handle message with only summary', () => {
      service.showSuccess({ summary: 'Success' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
      });
    });

    it('should handle message with only detail', () => {
      service.showSuccess({ detail: 'Success details' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        detail: 'Success details',
      });
    });

    it('should handle empty message object', () => {
      service.showSuccess({});

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
      });
    });
  });

  describe('showError', () => {
    it('should call messageService.add with error severity', () => {
      const message = {
        summary: 'Error',
        detail: 'An error occurred',
      };

      service.showError(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred',
      });
    });

    it('should handle error message with life property', () => {
      service.showError({ summary: 'Error', detail: 'Critical error', life: 10000 });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Critical error',
        life: 10000,
      });
    });

    it('should handle message with only summary', () => {
      service.showError({ summary: 'Error' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
      });
    });

    it('should handle message with only detail', () => {
      service.showError({ detail: 'Error details' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        detail: 'Error details',
      });
    });

    it('should handle empty message object', () => {
      service.showError({});

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
      });
    });
  });

  describe('showInfo', () => {
    it('should call messageService.add with info severity', () => {
      const message = {
        summary: 'Information',
        detail: 'Here is some information',
      };

      service.showInfo(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Information',
        detail: 'Here is some information',
      });
    });

    it('should handle info message with life property', () => {
      service.showInfo({ summary: 'Information', detail: 'Here is some information', life: 10000 });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Information',
        detail: 'Here is some information',
        life: 10000,
      });
    });

    it('should handle message with only summary', () => {
      service.showInfo({ summary: 'Information' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Information',
      });
    });

    it('should handle message with only detail', () => {
      service.showInfo({ detail: 'Information details' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        detail: 'Information details',
      });
    });

    it('should handle empty message object', () => {
      service.showInfo({});

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
      });
    });
  });

  describe('showWarn', () => {
    it('should call messageService.add with warn severity', () => {
      const message = {
        summary: 'Warning',
        detail: 'This is a warning',
      };

      service.showWarn(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: 'This is a warning',
      });
    });

    it('should handle warn message with life property', () => {
      service.showWarn({ summary: 'Warning', detail: 'This is a warning', life: 10000 });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: 'This is a warning',
        life: 10000,
      });
    });

    it('should handle message with only summary', () => {
      service.showWarn({ summary: 'Warning' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
      });
    });

    it('should handle message with only detail', () => {
      service.showWarn({ detail: 'Warning details' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        detail: 'Warning details',
      });
    });

    it('should handle empty message object', () => {
      service.showWarn({});

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
      });
    });
  });

  describe('showSuccessKey', () => {
    it('should translate and show success toast using base key', () => {
      service.showSuccessKey('app.message.created');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'app.message.created.summary',
        detail: 'app.message.created.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.message.created.summary', undefined);
      expect(translateMock.instant).toHaveBeenCalledWith('app.message.created.detail', undefined);
    });

    it('should translate with parameters', () => {
      const params = { name: 'John', count: '5' };

      service.showSuccessKey('app.message.saved', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'app.message.saved.summary',
        detail: 'app.message.saved.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.detail', params);
    });

    it('should handle parameters with special characters', () => {
      const params = { entity: 'User & Admin', action: '<delete>' };

      service.showSuccessKey('app.action.completed', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'app.action.completed.summary',
        detail: 'app.action.completed.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.detail', params);
    });
  });

  describe('showErrorKey', () => {
    it('should translate and show error toast using base key', () => {
      service.showErrorKey('app.error.failed');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'app.error.failed.summary',
        detail: 'app.error.failed.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.error.failed.summary', undefined);
      expect(translateMock.instant).toHaveBeenCalledWith('app.error.failed.detail', undefined);
    });

    it('should translate with parameters', () => {
      const params = { name: 'John', count: '5' };

      service.showErrorKey('app.message.saved', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'app.message.saved.summary',
        detail: 'app.message.saved.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.detail', params);
    });

    it('should handle parameters with special characters', () => {
      const params = { entity: 'User & Admin', action: '<delete>' };

      service.showErrorKey('app.action.completed', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'app.action.completed.summary',
        detail: 'app.action.completed.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.detail', params);
    });
  });

  describe('showInfoKey', () => {
    it('should translate and show info toast using base key', () => {
      service.showInfoKey('app.info.update');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'app.info.update.summary',
        detail: 'app.info.update.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.info.update.summary', undefined);
      expect(translateMock.instant).toHaveBeenCalledWith('app.info.update.detail', undefined);
    });

    it('should translate with parameters', () => {
      const params = { name: 'John', count: '5' };

      service.showInfoKey('app.message.saved', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'app.message.saved.summary',
        detail: 'app.message.saved.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.detail', params);
    });

    it('should handle parameters with special characters', () => {
      const params = { entity: 'User & Admin', action: '<delete>' };

      service.showInfoKey('app.action.completed', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'app.action.completed.summary',
        detail: 'app.action.completed.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.detail', params);
    });
  });

  describe('showWarnKey', () => {
    it('should translate and show warn toast using base key', () => {
      service.showWarnKey('app.warning.limit');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'app.warning.limit.summary',
        detail: 'app.warning.limit.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.warning.limit.summary', undefined);
      expect(translateMock.instant).toHaveBeenCalledWith('app.warning.limit.detail', undefined);
    });

    it('should translate with parameters', () => {
      const params = { name: 'John', count: '5' };

      service.showWarnKey('app.message.saved', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'app.message.saved.summary',
        detail: 'app.message.saved.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.message.saved.detail', params);
    });

    it('should handle parameters with special characters', () => {
      const params = { entity: 'User & Admin', action: '<delete>' };

      service.showWarnKey('app.action.completed', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'app.action.completed.summary',
        detail: 'app.action.completed.detail',
      });

      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.summary', params);
      expect(translateMock.instant).toHaveBeenCalledWith('app.action.completed.detail', params);
    });
  });

  describe('multiple toasts', () => {
    it('should handle multiple toast messages in sequence', () => {
      service.showSuccess({ summary: 'First' });
      service.showError({ summary: 'Second' });
      service.showInfo({ summary: 'Third' });

      expect(messageService.add).toHaveBeenCalledTimes(3);
      expect(messageService.add).toHaveBeenNthCalledWith(1, { severity: 'success', summary: 'First' });
      expect(messageService.add).toHaveBeenNthCalledWith(2, { severity: 'error', summary: 'Second' });
      expect(messageService.add).toHaveBeenNthCalledWith(3, { severity: 'info', summary: 'Third' });
    });

    it('should handle mixed direct and key-based toasts', () => {
      service.showSuccess({ summary: 'Direct message' });
      service.showSuccessKey('app.message.key');

      expect(messageService.add).toHaveBeenCalledTimes(2);
      expect(messageService.add).toHaveBeenNthCalledWith(1, { severity: 'success', summary: 'Direct message' });
      expect(messageService.add).toHaveBeenNthCalledWith(2, {
        severity: 'success',
        summary: 'app.message.key.summary',
        detail: 'app.message.key.detail',
      });
    });

    it('should handle all severity levels in sequence', () => {
      service.showSuccessKey('app.success');
      service.showErrorKey('app.error');
      service.showInfoKey('app.info');
      service.showWarnKey('app.warn');

      expect(messageService.add).toHaveBeenCalledTimes(4);
    });
  });

  describe('edge cases', () => {
    it('should handle very long summary text', () => {
      const longSummary = 'A'.repeat(1000);

      service.showSuccess({ summary: longSummary });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: longSummary,
      });
    });

    it('should handle very long detail text', () => {
      const longDetail = 'B'.repeat(2000);

      service.showError({ summary: 'Error', detail: longDetail });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: longDetail,
      });
    });

    it('should handle unicode characters in messages', () => {
      service.showInfo({ summary: '成功 ✓', detail: 'Операция завершена 🎉' });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: '成功 ✓',
        detail: 'Операция завершена 🎉',
      });
    });

    it('should handle zero life property', () => {
      service.showWarn({ summary: 'Warning', life: 0 });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        life: 0,
      });
    });

    it('should handle negative life property', () => {
      service.showError({ summary: 'Error', life: -1 });

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        life: -1,
      });
    });

    it('should handle empty string parameters', () => {
      service.showSuccessKey('app.message', { name: '' });

      expect(messageService.add).toHaveBeenCalled();
    });

    it('should handle baseKey with dots in parameters', () => {
      const params = { path: 'app.component.name' };

      service.showInfoKey('app.info.path', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'app.info.path.summary',
        detail: 'app.info.path.detail',
      });
    });
  });

  describe('severity combinations', () => {
    it('should maintain correct severity for each method', () => {
      const message = { summary: 'Test' };

      service.showSuccess(message);
      service.showError(message);
      service.showInfo(message);
      service.showWarn(message);

      expect(messageService.add).toHaveBeenNthCalledWith(1, { severity: 'success', summary: 'Test' });
      expect(messageService.add).toHaveBeenNthCalledWith(2, { severity: 'error', summary: 'Test' });
      expect(messageService.add).toHaveBeenNthCalledWith(3, { severity: 'info', summary: 'Test' });
      expect(messageService.add).toHaveBeenNthCalledWith(4, { severity: 'warn', summary: 'Test' });
    });

    it('should maintain correct severity for key-based methods', () => {
      service.showSuccessKey('app.test');
      service.showErrorKey('app.test');
      service.showInfoKey('app.test');
      service.showWarnKey('app.test');

      const calls = (messageService.add as any).mock.calls;
      expect(calls[0][0].severity).toBe('success');
      expect(calls[1][0].severity).toBe('error');
      expect(calls[2][0].severity).toBe('info');
      expect(calls[3][0].severity).toBe('warn');
    });
  });

  describe('parameter types', () => {
    it('should handle string parameters', () => {
      const params = { name: 'John Doe', action: 'created' };

      service.showSuccessKey('app.action', params);

      expect(messageService.add).toHaveBeenCalled();
    });

    it('should handle mixed parameter types', () => {
      const params = {
        name: 'Test User',
        count: '42',
        status: 'active',
      };

      service.showInfoKey('app.user.info', params);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'app.user.info.summary',
        detail: 'app.user.info.detail',
      });
    });

    it('should handle empty parameter object', () => {
      service.showWarnKey('app.warning', {});

      expect(messageService.add).toHaveBeenCalled();
    });
  });

  describe('Constructor and Component Creation', () => {
    it('should create toast component on initialization', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const attachViewSpy = vi.spyOn(appRef, 'attachView');

      const newService = TestBed.runInInjectionContext(() => new ToastService());

      expect(appendChildSpy).toHaveBeenCalled();
      expect(attachViewSpy).toHaveBeenCalled();
      expect(newService).toBeTruthy();

      const toastElements = document.body.querySelectorAll('jhi-toast');
      expect(toastElements.length).toBe(1);
    });

    it('should only create one toast component instance', () => {
      const service = TestBed.runInInjectionContext(() => new ToastService());

      service.showSuccess({ summary: 'Test' });
      service.showError({ summary: 'Test' });

      const toastElements = document.body.querySelectorAll('jhi-toast');
      expect(toastElements.length).toBe(1);
    });

    it('should attach toast component to document body', () => {
      TestBed.runInInjectionContext(() => new ToastService());
      const toastElements = document.body.querySelectorAll('jhi-toast');

      expect(toastElements.length).toBe(1);
    });

    it('should create toast component with available injector', () => {
      TestBed.runInInjectionContext(() => new ToastService());

      expect(envInjector).toBeDefined();
      const toastElements = document.body.querySelectorAll('jhi-toast');
      expect(toastElements.length).toBe(1);
    });
  });
});
