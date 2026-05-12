import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MessageService } from 'primeng/api';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { ToastService } from 'app/service/toast-service';
import { TranslateService } from '@ngx-translate/core';

describe('ToastService', () => {
  let service: ToastService;
  let messageService: MessageService;
  let translateMock: ReturnType<typeof createTranslateServiceMock>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService, MessageService, provideTranslateMock()],
    });

    service = TestBed.inject(ToastService);
    messageService = TestBed.inject(MessageService);
    translateMock = TestBed.inject(TranslateService) as ReturnType<typeof createTranslateServiceMock>;

    vi.spyOn(messageService, 'add');
    vi.spyOn(translateMock, 'instant');

    document.body.querySelectorAll('jhi-toast').forEach(el => el.remove());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['showSuccess', 'success'],
    ['showError', 'error'],
    ['showInfo', 'info'],
    ['showWarn', 'warn'],
  ] as const)('should call messageService.add with %s severity passing summary/detail/life', (method, severity) => {
    service[method]({ summary: 'S', detail: 'D', life: 5000 });
    expect(messageService.add).toHaveBeenCalledWith({ severity, summary: 'S', detail: 'D', life: 5000 });
  });

  it.each([
    ['showSuccessKey', 'success'],
    ['showErrorKey', 'error'],
    ['showInfoKey', 'info'],
    ['showWarnKey', 'warn'],
  ] as const)('should translate base key and show %s toast', (method, severity) => {
    const params = { name: 'John' };
    service[method]('app.message.x', params);
    expect(messageService.add).toHaveBeenCalledWith({
      severity,
      summary: 'app.message.x.summary',
      detail: 'app.message.x.detail',
    });
    expect(translateMock.instant).toHaveBeenCalledWith('app.message.x.summary', params);
    expect(translateMock.instant).toHaveBeenCalledWith('app.message.x.detail', params);
  });

  it('should handle multiple toast messages in sequence', () => {
    service.showSuccess({ summary: 'First' });
    service.showError({ summary: 'Second' });
    service.showInfo({ summary: 'Third' });

    expect(messageService.add).toHaveBeenCalledTimes(3);
    expect(messageService.add).toHaveBeenNthCalledWith(1, { severity: 'success', summary: 'First' });
    expect(messageService.add).toHaveBeenNthCalledWith(2, { severity: 'error', summary: 'Second' });
    expect(messageService.add).toHaveBeenNthCalledWith(3, { severity: 'info', summary: 'Third' });
  });
});
