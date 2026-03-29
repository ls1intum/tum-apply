import { GenderBiasAnalysisResourceApi } from 'app/generated/api/gender-bias-analysis-resource-api';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

export type GenderBiasAnalysisResourceApiMock = Pick<GenderBiasAnalysisResourceApi, 'analyzeHtmlContent'>;

export function createGenderBiasAnalysisResourceApiMock(): GenderBiasAnalysisResourceApiMock {
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

export function provideGenderBiasAnalysisResourceApiMock(
  mock: GenderBiasAnalysisResourceApiMock = createGenderBiasAnalysisResourceApiMock(),
): Provider {
  return { provide: GenderBiasAnalysisResourceApi, useValue: mock };
}
