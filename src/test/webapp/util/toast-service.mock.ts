import { ToastService } from 'app/service/toast-service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type ToastServiceMock = Pick<
  ToastService,
  'showErrorKey' | 'showError' | 'showSuccessKey' | 'showSuccess' | 'showInfoKey' | 'showInfo' | 'showWarnKey' | 'showWarn'
>;

export function createToastServiceMock(): ToastServiceMock {
  return {
    showErrorKey: vi.fn(),
    showError: vi.fn(),
    showSuccessKey: vi.fn(),
    showSuccess: vi.fn(),
    showInfoKey: vi.fn(),
    showInfo: vi.fn(),
    showWarnKey: vi.fn(),
    showWarn: vi.fn(),
  };
}

export function provideToastServiceMock(mock: ToastServiceMock = createToastServiceMock()): Provider {
  return { provide: ToastService, useValue: mock };
}
