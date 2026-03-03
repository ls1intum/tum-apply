import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createGenderBiasAnalysisResourceApiServiceMock,
  provideGenderBiasAnalysisResourceApiServiceMock,
  GenderBiasAnalysisResourceApiServiceMock,
} from 'util/gender-bias-analysis-resource-api.service.mock';
import { of, throwError } from 'rxjs';
import { GenderBiasAnalysisResponse } from 'app/generated';
import { GenderBiasAnalysisService } from 'app/shared/gender-bias-analysis/gender-bias-analysis';

describe('GenderBiasAnalysisService', () => {
  let service: GenderBiasAnalysisService;
  let apiServiceMock: GenderBiasAnalysisResourceApiServiceMock;

  beforeEach(() => {
    apiServiceMock = createGenderBiasAnalysisResourceApiServiceMock();

    TestBed.configureTestingModule({
      providers: [GenderBiasAnalysisService, provideGenderBiasAnalysisResourceApiServiceMock(apiServiceMock)],
    });

    service = TestBed.inject(GenderBiasAnalysisService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('getAnalysisForField', () => {
    it('should return an observable for a field', () => {
      const fieldId = 'test-field';

      const analysis = service.getAnalysisForField(fieldId);

      expect(analysis).toBeDefined();
    });

    it('should return the same observable for the same field id', () => {
      const fieldId = 'test-field';

      const analysis1 = service.getAnalysisForField(fieldId);
      const analysis2 = service.getAnalysisForField(fieldId);

      expect(analysis1).toBe(analysis2);
    });

    it('should return different observables for different field ids', () => {
      const fieldId1 = 'test-field-1';
      const fieldId2 = 'test-field-2';

      const analysis1 = service.getAnalysisForField(fieldId1);
      const analysis2 = service.getAnalysisForField(fieldId2);

      expect(analysis1).not.toBe(analysis2);
    });

    it('should return null when text is empty', async () => {
      const fieldId = 'test-field';
      let result: GenderBiasAnalysisResponse | null | undefined;

      const analysis = service.getAnalysisForField(fieldId);
      analysis.subscribe(value => {
        result = value;
      });

      service.triggerAnalysis(fieldId, '', 'en');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result).toBeNull();
    });

    it('should return null when text is only whitespace', async () => {
      const fieldId = 'test-field';
      let result: GenderBiasAnalysisResponse | null | undefined;

      const analysis = service.getAnalysisForField(fieldId);
      analysis.subscribe(value => {
        result = value;
      });

      service.triggerAnalysis(fieldId, '   ', 'en');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result).toBeNull();
    });

    it('should call API and return result for valid text', async () => {
      vi.useFakeTimers();
      const fieldId = 'test-field';
      const mockResponse: GenderBiasAnalysisResponse = {
        coding: 'male',
        biasedWords: [{ word: 'he', type: 'male' }],
      };

      apiServiceMock.analyzeHtmlContent = vi.fn().mockReturnValue(of(mockResponse));

      let result: GenderBiasAnalysisResponse | null | undefined;
      const analysis = service.getAnalysisForField(fieldId);
      analysis.subscribe(value => {
        result = value;
      });

      service.triggerAnalysis(fieldId, 'Test text', 'en');

      // Advance timers to trigger the immediate analysis
      vi.runAllTimers();

      expect(result).toEqual(mockResponse);
      expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledOnce();
      expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
        text: 'Test text',
        language: 'en',
      });
    });

    it('should return null when API call fails', async () => {
      vi.useFakeTimers();
      const fieldId = 'test-field';

      apiServiceMock.analyzeHtmlContent = vi.fn().mockReturnValue(throwError(() => new Error('API error')));

      let result: GenderBiasAnalysisResponse | null | undefined;
      const analysis = service.getAnalysisForField(fieldId);
      analysis.subscribe(value => {
        result = value;
      });

      service.triggerAnalysis(fieldId, 'Test text', 'en');

      vi.runAllTimers();

      expect(result).toBeNull();
    });
  });

  describe('analyzeHtmlContent', () => {
    it('should call the API service with correct parameters', async () => {
      const request = { text: 'Test text', language: 'en' };
      const mockResponse: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: [],
      };

      apiServiceMock.analyzeHtmlContent = vi.fn().mockReturnValue(of(mockResponse));

      let result: GenderBiasAnalysisResponse | undefined;
      service.analyzeHtmlContent(request).subscribe(value => {
        result = value;
      });

      expect(result).toEqual(mockResponse);
      expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledOnce();
      expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith(request);
    });
  });

  describe('triggerAnalysis', () => {
    describe('debounced behavior', () => {
      it('should debounce analysis calls within 400ms', async () => {
        vi.useFakeTimers();
        const fieldId = 'test-field';

        const results: (GenderBiasAnalysisResponse | null)[] = [];
        const analysis$ = service.getAnalysisForField(fieldId);
        analysis$.subscribe(value => {
          results.push(value);
        });

        // Initialize the field with first call
        service.triggerAnalysis(fieldId, 'Initial', 'en');
        vi.advanceTimersByTime(500);

        // Reset mock to track subsequent calls
        vi.clearAllMocks();

        // Trigger multiple analyses quickly
        service.triggerAnalysis(fieldId, 'Test 1', 'en');
        service.triggerAnalysis(fieldId, 'Test 2', 'en');
        service.triggerAnalysis(fieldId, 'Test 3', 'en');

        // Advance time by less than debounce time
        vi.advanceTimersByTime(200);
        expect(apiServiceMock.analyzeHtmlContent).not.toHaveBeenCalled();

        // Advance time to complete debounce
        vi.advanceTimersByTime(300);

        // Should only call API once with the last value
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledOnce();
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'Test 3',
          language: 'en',
        });
      });

      it('should not debounce when text changes after debounce period', async () => {
        vi.useFakeTimers();
        const fieldId = 'test-field';

        const analysis = service.getAnalysisForField(fieldId);
        analysis.subscribe(() => {});

        service.triggerAnalysis(fieldId, 'Test 1', 'en');
        vi.advanceTimersByTime(500);

        vi.clearAllMocks();

        service.triggerAnalysis(fieldId, 'Test 2', 'en');
        vi.advanceTimersByTime(500);

        service.triggerAnalysis(fieldId, 'Test 3', 'en');
        vi.advanceTimersByTime(500);

        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledTimes(2);
      });
    });

    describe('immediate behavior', () => {
      it('should analyze immediately on first load', async () => {
        vi.useFakeTimers();
        const fieldId = 'test-field';

        const analysis = service.getAnalysisForField(fieldId);
        analysis.subscribe(() => {});

        service.triggerAnalysis(fieldId, 'First text', 'en');

        vi.runAllTimers();

        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledOnce();
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'First text',
          language: 'en',
        });
      });

      it('should analyze immediately when language changes', async () => {
        vi.useFakeTimers();
        const fieldId = 'test-field';

        const analysis = service.getAnalysisForField(fieldId);
        analysis.subscribe(() => {});

        service.triggerAnalysis(fieldId, 'Test', 'en');
        vi.advanceTimersByTime(500);

        vi.clearAllMocks();

        service.triggerAnalysis(fieldId, 'Test', 'de');
        vi.runAllTimers();

        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledOnce();
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'Test',
          language: 'de',
        });
      });

      it('should analyze immediately when language changes back to original', async () => {
        vi.useFakeTimers();
        const fieldId = 'test-field';

        const analysis = service.getAnalysisForField(fieldId);
        analysis.subscribe(() => {});

        service.triggerAnalysis(fieldId, 'Test', 'en');
        vi.advanceTimersByTime(500);

        service.triggerAnalysis(fieldId, 'Test', 'de');
        vi.advanceTimersByTime(500);

        vi.clearAllMocks();

        service.triggerAnalysis(fieldId, 'Test', 'en');
        vi.runAllTimers();

        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledOnce();
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'Test',
          language: 'en',
        });
      });
    });

    describe('field initialization', () => {
      it('should initialize field and retry when subjects do not exist', () => {
        const fieldId = 'new-field';

        expect(() => {
          service.triggerAnalysis(fieldId, 'Test text', 'en');
        }).not.toThrow();

        const analysis = service.getAnalysisForField(fieldId);
        expect(analysis).toBeDefined();
      });
    });

    describe('multiple fields', () => {
      it('should handle multiple fields independently', async () => {
        vi.useFakeTimers();
        const fieldId1 = 'field-1';
        const fieldId2 = 'field-2';

        const analysis1 = service.getAnalysisForField(fieldId1);
        const analysis2 = service.getAnalysisForField(fieldId2);
        analysis1.subscribe(() => {});
        analysis2.subscribe(() => {});

        service.triggerAnalysis(fieldId1, 'Text 1', 'en');
        service.triggerAnalysis(fieldId2, 'Text 2', 'de');

        vi.runAllTimers();

        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledTimes(2);
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'Text 1',
          language: 'en',
        });
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'Text 2',
          language: 'de',
        });
      });

      it('should track language changes independently for each field', async () => {
        vi.useFakeTimers();
        const fieldId1 = 'field-1';
        const fieldId2 = 'field-2';

        const analysis1 = service.getAnalysisForField(fieldId1);
        const analysis2 = service.getAnalysisForField(fieldId2);
        analysis1.subscribe(() => {});
        analysis2.subscribe(() => {});

        service.triggerAnalysis(fieldId1, 'Text', 'en');
        service.triggerAnalysis(fieldId2, 'Text', 'en');
        vi.advanceTimersByTime(500);

        vi.clearAllMocks();

        service.triggerAnalysis(fieldId1, 'Text', 'de');

        service.triggerAnalysis(fieldId2, 'New text', 'en');

        vi.runAllTimers();

        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledTimes(2);
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'Text',
          language: 'de',
        });
        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledWith({
          text: 'New text',
          language: 'en',
        });
      });

      it('should track first load independently for each field', async () => {
        vi.useFakeTimers();
        const fieldId1 = 'field-1';
        const fieldId2 = 'field-2';

        const analysis1 = service.getAnalysisForField(fieldId1);
        const analysis2 = service.getAnalysisForField(fieldId2);
        analysis1.subscribe(() => {});
        analysis2.subscribe(() => {});

        service.triggerAnalysis(fieldId1, 'Text 1', 'en');
        vi.advanceTimersByTime(100);

        service.triggerAnalysis(fieldId2, 'Text 2', 'en');
        vi.runAllTimers();

        expect(apiServiceMock.analyzeHtmlContent).toHaveBeenCalledTimes(2);
      });
    });
  });
});
