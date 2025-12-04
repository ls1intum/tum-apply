import { vi } from 'vitest';
import { Provider } from '@angular/core';
import { AlertService } from 'app/core/util/alert.service';

export type AlertServiceMock = Pick<AlertService, 'get' | 'clear' | 'addAlert'>;

export function createAlertServiceMock(): AlertServiceMock {
  return {
    get: vi.fn().mockReturnValue([{ id: 1, type: 'success', message: 'Test', toast: false, position: 'top-right' }]),
    clear: vi.fn(),
    addAlert: vi.fn(),
  };
}

export function provideAlertServiceMock(mock: AlertServiceMock = createAlertServiceMock()): Provider {
  return { provide: AlertService, useValue: mock };
}
