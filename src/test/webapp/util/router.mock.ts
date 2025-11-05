import { vi } from 'vitest';
import { Router } from '@angular/router';

export function createRouterMock() {
  return {
    navigate: vi.fn(),
  } as unknown as Router;
}

export function provideRouterMock(mock = createRouterMock()) {
  return { provide: Router, useValue: mock };
}
