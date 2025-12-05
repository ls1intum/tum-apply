import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GenderBiasAnalysisRequest, GenderBiasAnalysisResponse } from 'app/generated';
import { firstValueFrom } from 'rxjs';
import { GenderBiasAnalysisService } from 'app/service/gender-bias-analysis-service';

describe('GenderBiasAnalysisService', () => {
  let service: GenderBiasAnalysisService;
  let httpMock: HttpTestingController;
  const resourceUrl = '/api/gender-bias';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GenderBiasAnalysisService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(GenderBiasAnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  describe('getAnalysisForField', () => {
    it('should create new observable for new field ID', () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      expect(analysis).toBeDefined();
    });

    it('should return same observable for same field ID', () => {
      const fieldId = 'test-field';
      const analysis1 = service.getAnalysisForField(fieldId);
      const analysis2 = service.getAnalysisForField(fieldId);

      expect(analysis1).toBe(analysis2);
    });

    it('should return different observables for different field IDs', () => {
      const fieldId1 = 'test-field-1';
      const fieldId2 = 'test-field-2';
      const analysis1 = service.getAnalysisForField(fieldId1);
      const analysis2 = service.getAnalysisForField(fieldId2);

      expect(analysis1).not.toBe(analysis2);
    });

    it('should emit null initially without trigger', async () => {
      vi.useFakeTimers();

      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      let emitted = false;
      const subscription = analysis.subscribe(() => {
        emitted = true;
      });

      vi.advanceTimersByTime(100);

      expect(emitted).toBe(false);
      subscription.unsubscribe();
    });

    it('should emit null for empty text after trigger', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, '', 'en');

      const result = await resultPromise;
      expect(result).toBeNull();
    });

    it('should emit analysis result for valid text after trigger', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const expectedResponse: GenderBiasAnalysisResponse = {
        biasedWords: [{ word: 'engineer', type: 'masculine' }],
        coding: 'coded',
        language: 'en',
        originalText: '<p>Software engineer</p>',
      };

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, '<p>Software engineer</p>', 'en');

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req.flush(expectedResponse);

      const result = await resultPromise;
      expect(result).toEqual(expectedResponse);
    });

    it('should emit null on HTTP error (catchError behavior)', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, '<p>Test text</p>', 'en');

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      const result = await resultPromise;
      expect(result).toBeNull();
    });

    it('should return of(null) when analysis observable does not exist in map', async () => {
      const fieldId = 'non-existent-field';

      (service as any).analyses.set(fieldId, undefined);

      const analysis = service.getAnalysisForField(fieldId);
      const result = await firstValueFrom(analysis);

      expect(result).toBeNull();

      (service as any).analyses.delete(fieldId);
    });
  });

  describe('analyzeHtmlContent', () => {
    it('should make POST request with correct URL and body', async () => {
      const request: GenderBiasAnalysisRequest = {
        text: '<p>This is a test text</p>',
        language: 'en',
      };

      const expectedResponse: GenderBiasAnalysisResponse = {
        biasedWords: [{ word: 'test', type: 'masculine' }],
        coding: 'coded-text',
        language: 'en',
        originalText: '<p>This is a test text</p>',
      };

      const responsePromise = firstValueFrom(service.analyzeHtmlContent(request));

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(expectedResponse);

      const response = await responsePromise;
      expect(response).toEqual(expectedResponse);
    });

    it('should handle empty request', async () => {
      const request: GenderBiasAnalysisRequest = {};

      const expectedResponse: GenderBiasAnalysisResponse = {
        biasedWords: [],
      };

      const responsePromise = firstValueFrom(service.analyzeHtmlContent(request));

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      expect(req.request.method).toBe('POST');
      req.flush(expectedResponse);

      const response = await responsePromise;
      expect(response).toEqual(expectedResponse);
    });

    it('should propagate HTTP errors', async () => {
      const request: GenderBiasAnalysisRequest = {
        text: '<p>Test</p>',
        language: 'en',
      };

      const responsePromise = firstValueFrom(service.analyzeHtmlContent(request));

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      await expect(responsePromise).rejects.toThrow();
    });
  });

  describe('triggerAnalysis', () => {
    it('should trigger immediate analysis on first load', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const expectedResponse: GenderBiasAnalysisResponse = {
        biasedWords: [],
        language: 'en',
        originalText: '<p>First load</p>',
      };

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, '<p>First load</p>', 'en');

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req.flush(expectedResponse);

      const result = await resultPromise;
      expect(result).toEqual(expectedResponse);
    });

    it('should debounce subsequent analyses with same language', async () => {
      vi.useFakeTimers();

      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      let emissionCount = 0;

      analysis.subscribe(() => {
        emissionCount++;
      });

      service.triggerAnalysis(fieldId, '<p>First</p>', 'en');

      const req1 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req1.flush({ biasedWords: [], language: 'en', originalText: '<p>First</p>' });

      service.triggerAnalysis(fieldId, '<p>Second</p>', 'en');
      service.triggerAnalysis(fieldId, '<p>Third</p>', 'en');
      service.triggerAnalysis(fieldId, '<p>Fourth</p>', 'en');

      // Wait for debounce time (400ms) + buffer
      vi.advanceTimersByTime(500);

      // Should only have made 2 requests: 1 immediate + 1 debounced (last one)
      const req2 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      expect(req2.request.body.text).toBe('<p>Fourth</p>');
      req2.flush({ biasedWords: [], language: 'en', originalText: '<p>Fourth</p>' });

      // Should have 2 emissions total
      expect(emissionCount).toBe(2);
    });

    it('should trigger immediate analysis when language changes', async () => {
      vi.useFakeTimers();

      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      let emissionCount = 0;

      analysis.subscribe(() => {
        emissionCount++;
      });

      service.triggerAnalysis(fieldId, '<p>English text</p>', 'en');

      const req1 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      expect(req1.request.body.language).toBe('en');
      req1.flush({ biasedWords: [], language: 'en', originalText: '<p>English text</p>' });

      // Wait a bit, then change language (should be immediate, not debounced)
      vi.advanceTimersByTime(100);

      service.triggerAnalysis(fieldId, '<p>Deutscher Text</p>', 'de');

      const req2 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      expect(req2.request.body.language).toBe('de');
      req2.flush({ biasedWords: [], language: 'de', originalText: '<p>Deutscher Text</p>' });

      expect(emissionCount).toBe(2);
    });

    it('should handle empty text by emitting null', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, '', 'en');

      const result = await resultPromise;
      expect(result).toBeNull();
    });

    it('should auto-initialize when subjects do not exist and return early', () => {
      const fieldId = 'test-field';

      const getAnalysisSpy = vi.spyOn(service, 'getAnalysisForField');

      service.triggerAnalysis(fieldId, '<p>Test</p>', 'en');

      expect(getAnalysisSpy).toHaveBeenCalledWith(fieldId);

      expect((service as any).analyzeSubjects.has(fieldId)).toBe(true);
      expect((service as any).immediateAnalyzeSubjects.has(fieldId)).toBe(true);
      expect((service as any).analyses.has(fieldId)).toBe(true);

      getAnalysisSpy.mockRestore();
    });

    it('should track last language per field independently', async () => {
      vi.useFakeTimers();

      const fieldId1 = 'test-field-1';
      const fieldId2 = 'test-field-2';

      const analysis1 = service.getAnalysisForField(fieldId1);
      const analysis2 = service.getAnalysisForField(fieldId2);

      let emissionCount1 = 0;
      let emissionCount2 = 0;

      analysis1.subscribe(() => {
        emissionCount1++;
      });

      analysis2.subscribe(() => {
        emissionCount2++;
      });

      service.triggerAnalysis(fieldId1, '<p>English</p>', 'en');
      const req1 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req1.flush({ biasedWords: [], language: 'en', originalText: '<p>English</p>' });

      service.triggerAnalysis(fieldId2, '<p>Deutsch</p>', 'de');
      const req2 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req2.flush({ biasedWords: [], language: 'de', originalText: '<p>Deutsch</p>' });

      vi.advanceTimersByTime(100);

      service.triggerAnalysis(fieldId1, '<p>Deutsch</p>', 'de');
      const req3 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req3.flush({ biasedWords: [], language: 'de', originalText: '<p>Deutsch</p>' });

      service.triggerAnalysis(fieldId2, '<p>Mehr Deutsch</p>', 'de');

      vi.advanceTimersByTime(500);

      const req4 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req4.flush({ biasedWords: [], language: 'de', originalText: '<p>Mehr Deutsch</p>' });

      expect(emissionCount1).toBe(2);
      expect(emissionCount2).toBe(2);
    });

    it('should mark field as loaded after first trigger', async () => {
      vi.useFakeTimers();

      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      let emissionCount = 0;

      analysis.subscribe(() => {
        emissionCount++;
      });

      service.triggerAnalysis(fieldId, '<p>First</p>', 'en');
      const req1 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req1.flush({ biasedWords: [], language: 'en', originalText: '<p>First</p>' });

      vi.advanceTimersByTime(100);

      service.triggerAnalysis(fieldId, '<p>Second</p>', 'en');

      vi.advanceTimersByTime(500);

      const req2 = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req2.flush({ biasedWords: [], language: 'en', originalText: '<p>Second</p>' });

      expect(emissionCount).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long text', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const longText = '<p>' + 'word '.repeat(10000) + '</p>';

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, longText, 'en');

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      expect(req.request.body.text).toBe(longText);
      req.flush({ biasedWords: [], language: 'en', originalText: longText });

      const result = await resultPromise;
      expect(result?.originalText).toBe(longText);
    });

    it('should handle special HTML characters', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const specialText = '<p>&lt;div&gt; &amp; &quot;quotes&quot;</p>';

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, specialText, 'en');

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req.flush({ biasedWords: [], language: 'en', originalText: specialText });

      const result = await resultPromise;
      expect(result?.originalText).toBe(specialText);
    });

    it('should handle response with missing optional fields', async () => {
      const fieldId = 'test-field';
      const analysis = service.getAnalysisForField(fieldId);

      const minimalResponse: GenderBiasAnalysisResponse = {};

      const resultPromise = firstValueFrom(analysis);

      service.triggerAnalysis(fieldId, '<p>Text</p>', 'en');

      const req = httpMock.expectOne(`${resourceUrl}/analyze-html`);
      req.flush(minimalResponse);

      const result = await resultPromise;
      expect(result).toEqual(minimalResponse);
    });
  });
});
