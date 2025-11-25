import { vi } from 'vitest';

export class MockAlertService {
  get = vi.fn().mockReturnValue([{ id: 1, type: 'success', message: 'Test', toast: false, position: 'top-right' }]);
  clear = vi.fn();
  addAlert = vi.fn();
}
