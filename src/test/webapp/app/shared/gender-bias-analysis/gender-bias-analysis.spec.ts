import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createGenderBiasAnalysisResourceApiMock,
  provideGenderBiasAnalysisResourceApiMock,
  GenderBiasAnalysisResourceApiMock,
} from 'util/gender-bias-analysis-resource-api.service.mock';
import { of, throwError } from 'rxjs';
import { GenderBiasAnalysisResponse } from 'app/generated/model/gender-bias-analysis-response';
import { GenderBiasAnalysisService } from 'app/shared/gender-bias-analysis/gender-bias-analysis';

describe('GenderBiasAnalysisService', () => {
  let service: GenderBiasAnalysisService;
  let apiMock: GenderBiasAnalysisResourceApiMock;

  beforeEach(() => {
    apiMock = createGenderBiasAnalysisResourceApiMock();
    TestBed.configureTestingModule({
      providers: [GenderBiasAnalysisService, provideGenderBiasAnalysisResourceApiMock(apiMock)],
    });
    service = TestBed.inject(GenderBiasAnalysisService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('getAnalysisForField', () => {
    it('should return same observable for same id and different observables for different ids', () => {
      expect(service.getAnalysisForField('a')).toBe(service.getAnalysisForField('a'));
      expect(service.getAnalysisForField('a')).not.toBe(service.getAnalysisForField('b'));
    });

    it.each(['', '   '])('should return undefined when text is "%s"', async text => {
      let result: GenderBiasAnalysisResponse | undefined;
      service.getAnalysisForField('f').subscribe(v => (result = v));
      service.triggerAnalysis('f', text, 'en');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(result).toBeUndefined();
    });

    it('should call API and return result for valid text', async () => {
      vi.useFakeTimers();
      const mockResponse: GenderBiasAnalysisResponse = { coding: 'male', biasedWords: [{ word: 'he', type: 'male' }] };
      apiMock.analyzeHtmlContent = vi.fn().mockReturnValue(of(mockResponse));

      let result: GenderBiasAnalysisResponse | undefined;
      service.getAnalysisForField('f').subscribe(v => (result = v));
      service.triggerAnalysis('f', 'Test text', 'en');
      vi.runAllTimers();

      expect(result).toEqual(mockResponse);
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledOnce();
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledWith({ text: 'Test text', language: 'en' });
    });

    it('should return undefined when API call fails', async () => {
      vi.useFakeTimers();
      apiMock.analyzeHtmlContent = vi.fn().mockReturnValue(throwError(() => new Error('API error')));

      let result: GenderBiasAnalysisResponse | undefined;
      service.getAnalysisForField('f').subscribe(v => (result = v));
      service.triggerAnalysis('f', 'Test text', 'en');
      vi.runAllTimers();

      expect(result).toBeUndefined();
    });
  });

  describe('analyzeHtmlContent', () => {
    it('should call the API service with correct parameters', () => {
      const request = { text: 'Test text', language: 'en' };
      const mockResponse: GenderBiasAnalysisResponse = { coding: 'neutral', biasedWords: [] };
      apiMock.analyzeHtmlContent = vi.fn().mockReturnValue(of(mockResponse));

      let result: GenderBiasAnalysisResponse | undefined;
      service.analyzeHtmlContent(request).subscribe(v => (result = v));

      expect(result).toEqual(mockResponse);
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledWith(request);
    });
  });

  describe('triggerAnalysis', () => {
    it('should debounce rapid analysis calls and only fire once with last value', () => {
      vi.useFakeTimers();
      service.getAnalysisForField('f').subscribe(() => {});

      service.triggerAnalysis('f', 'Initial', 'en');
      vi.advanceTimersByTime(500);
      vi.clearAllMocks();

      service.triggerAnalysis('f', 'Test 1', 'en');
      service.triggerAnalysis('f', 'Test 2', 'en');
      service.triggerAnalysis('f', 'Test 3', 'en');

      vi.advanceTimersByTime(200);
      expect(apiMock.analyzeHtmlContent).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledOnce();
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledWith({ text: 'Test 3', language: 'en' });
    });

    it('should analyze immediately on first load and when language changes', () => {
      vi.useFakeTimers();
      service.getAnalysisForField('f').subscribe(() => {});

      service.triggerAnalysis('f', 'Test', 'en');
      vi.advanceTimersByTime(500);
      vi.clearAllMocks();

      service.triggerAnalysis('f', 'Test', 'de');
      vi.runAllTimers();

      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledOnce();
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledWith({ text: 'Test', language: 'de' });
    });

    it('should handle multiple fields independently', () => {
      vi.useFakeTimers();
      service.getAnalysisForField('f1').subscribe(() => {});
      service.getAnalysisForField('f2').subscribe(() => {});

      service.triggerAnalysis('f1', 'Text 1', 'en');
      service.triggerAnalysis('f2', 'Text 2', 'de');
      vi.runAllTimers();

      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledTimes(2);
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledWith({ text: 'Text 1', language: 'en' });
      expect(apiMock.analyzeHtmlContent).toHaveBeenCalledWith({ text: 'Text 2', language: 'de' });
    });
  });
});
