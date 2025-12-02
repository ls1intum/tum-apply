import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { EventManager } from 'app/core/util/event-manager.service';

export type EventManagerMock = Pick<EventManager, 'subscribe' | 'destroy'> & {
  subscribe: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

export function createEventManagerMock(): EventManagerMock {
  return {
    subscribe: vi.fn().mockImplementation((_event: string, cb: any) => {
      return { unsubscribe: vi.fn() };
    }),
    destroy: vi.fn(),
  };
}

export function provideEventManagerMock(mock: EventManagerMock = createEventManagerMock()): Provider {
  return { provide: EventManager, useValue: mock };
}
