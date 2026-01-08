import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';
import { GenderBiasAnalysisResponse } from 'app/generated';
import { GenderBiasAnalysisService } from 'app/shared/gender-bias-analysis/gender-bias-analysis';

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
