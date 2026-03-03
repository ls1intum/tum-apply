import { GenderBiasAnalysisResourceApiService } from 'app/generated';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

export type GenderBiasAnalysisResourceApiServiceMock = Pick<GenderBiasAnalysisResourceApiService, 'analyzeHtmlContent'>;

export function createGenderBiasAnalysisResourceApiServiceMock(): GenderBiasAnalysisResourceApiServiceMock {
  return {
    analyzeHtmlContent: vi.fn().mockReturnValue(
      of(
        new HttpResponse({
          body: {
            coding: 'neutral',
            biasedWords: [],
          },
          status: 200,
        }),
      ),
    ),
  };
}

export function provideGenderBiasAnalysisResourceApiServiceMock(
  mock: GenderBiasAnalysisResourceApiServiceMock = createGenderBiasAnalysisResourceApiServiceMock(),
): Provider {
  return { provide: GenderBiasAnalysisResourceApiService, useValue: mock };
}
