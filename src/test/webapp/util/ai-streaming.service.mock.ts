import { AiStreamingService } from 'app/service/ai-streaming.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type AiStreamingServiceMock = {
  generateJobDescriptionStream: ReturnType<typeof vi.fn>;
};

export function createAiStreamingServiceMock(): AiStreamingServiceMock {
  return {
    generateJobDescriptionStream: vi.fn(),
  };
}

export function provideAiStreamingServiceMock(mock: AiStreamingServiceMock = createAiStreamingServiceMock()): Provider {
  return { provide: AiStreamingService, useValue: mock };
}
