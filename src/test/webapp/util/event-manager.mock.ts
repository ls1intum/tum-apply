import { vi } from 'vitest';
import { EventManager } from 'app/core/util/event-manager.service';
import { type Provider } from '@angular/core';

export class MockEventManager {
  subscribe = vi.fn().mockImplementation((_event: string, cb: any) => {
    return { unsubscribe: vi.fn() };
  });
  destroy = vi.fn();
}

export function provideEventManagerMock(mock: MockEventManager = new MockEventManager()): Provider {
  return { provide: EventManager, useValue: mock };
}
