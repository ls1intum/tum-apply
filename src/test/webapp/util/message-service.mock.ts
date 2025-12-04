import { MessageService } from 'primeng/api';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export class MessageServiceMock {
  add = vi.fn();
}

export function provideMessageServiceMock(mock: MessageServiceMock = new MessageServiceMock()): Provider {
  return { provide: MessageService, useValue: mock };
}
