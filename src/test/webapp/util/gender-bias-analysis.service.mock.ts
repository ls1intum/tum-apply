// gender-bias-analysis.service.mock.ts
import { GenderBiasAnalysisService } from 'app/service/gender-bias-analysis-service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';
import { GenderBiasAnalysisResponse } from 'app/generated';

export type GenderBiasAnalysisServiceMock = Pick<GenderBiasAnalysisService, 'triggerAnalysis' | 'getAnalysisForField'>;
export function createGenderBiasAnalysisServiceMock(): GenderBiasAnalysisServiceMock {
  const analysisSubject = new BehaviorSubject<GenderBiasAnalysisResponse | null>(null);

  return {
    triggerAnalysis: vi.fn(),
    getAnalysisForField: vi.fn().mockReturnValue(analysisSubject.asObservable()),
  };
}

export function provideGenderBiasAnalysisServiceMock(
  mock: GenderBiasAnalysisServiceMock = createGenderBiasAnalysisServiceMock(),
): Provider {
  return { provide: GenderBiasAnalysisService, useValue: mock };
}
