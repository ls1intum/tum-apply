import { vi } from 'vitest';
import { Event as RouterEvent, Router } from '@angular/router';
import { Provider } from '@angular/core';
import { Subject } from 'rxjs';

export type RouterMock = {
  navigate: ReturnType<typeof vi.fn>;
  url: string;
  events: Subject<RouterEvent>;
  routerState: {
    snapshot: {
      root: {
        firstChild: null;
        data: Record<string, unknown>;
      };
    };
  };
};

export function createRouterMock(): RouterMock {
  return {
    navigate: vi.fn().mockResolvedValue(true),
    url: '/',
    events: new Subject<RouterEvent>(),
    routerState: {
      snapshot: {
        root: {
          firstChild: null,
          data: {},
        },
      },
    },
  };
}

export function provideRouterMock(mock: RouterMock = createRouterMock()): Provider {
  return { provide: Router, useValue: mock };
}
