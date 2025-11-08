import { vi } from 'vitest';
import { Router } from '@angular/router';

export type RouterMock = Pick<Router, 'navigate'>;

export function createRouterMock(): RouterMock {
  return {
    navigate: vi.fn(),
  };
}

export function provideRouterMock(mock = createRouterMock()) {
  return { provide: Router, useValue: mock };
}
