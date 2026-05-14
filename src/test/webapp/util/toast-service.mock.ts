import { ToastService } from 'app/service/toast-service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

type ToastServiceMethods = Pick<
  ToastService,
  'showErrorKey' | 'showError' | 'showSuccessKey' | 'showSuccess' | 'showInfoKey' | 'showInfo' | 'showWarnKey' | 'showWarn'
>;

export type ToastServiceMock = {
  [K in keyof ToastServiceMethods]: ReturnType<typeof vi.fn<ToastServiceMethods[K]>>;
};

export function createToastServiceMock(): ToastServiceMock {
  return {
    showErrorKey: vi.fn<ToastServiceMethods['showErrorKey']>(),
    showError: vi.fn<ToastServiceMethods['showError']>(),
    showSuccessKey: vi.fn<ToastServiceMethods['showSuccessKey']>(),
    showSuccess: vi.fn<ToastServiceMethods['showSuccess']>(),
    showInfoKey: vi.fn<ToastServiceMethods['showInfoKey']>(),
    showInfo: vi.fn<ToastServiceMethods['showInfo']>(),
    showWarnKey: vi.fn<ToastServiceMethods['showWarnKey']>(),
    showWarn: vi.fn<ToastServiceMethods['showWarn']>(),
  };
}

export function provideToastServiceMock(mock: ToastServiceMock = createToastServiceMock()): Provider {
  return { provide: ToastService, useValue: mock };
}
