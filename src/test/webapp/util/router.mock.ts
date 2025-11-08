import { vi } from 'vitest';
import { Router } from '@angular/router';
import { Provider } from '@angular/core';

export type RouterMock = Pick<Router, 'navigate'>;

export function createRouterMock(): RouterMock {
  return {
    navigate: vi.fn(),
  };
}

export function provideRouterMock(mock: RouterMock = createRouterMock()): Provider {
  return { provide: Router, useValue: mock };
}
