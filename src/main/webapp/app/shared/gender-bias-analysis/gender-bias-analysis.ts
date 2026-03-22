import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError, debounceTime, merge, of, shareReplay, switchMap } from 'rxjs';
import { GenderBiasAnalysisRequest, GenderBiasAnalysisResourceApiService, GenderBiasAnalysisResponse } from 'app/generated';
import { extractTextFromHtml } from 'app/shared/util/text.util';

const DEFAULT_INCLUSIVE_WEIGHT = 1;
const CODING_FACTORS = {
  neutral: 1,
  'inclusive-coded': 0.9,
  'non-inclusive-coded': 0.2,
} as const;

@Injectable({ providedIn: 'root' })
export class GenderBiasAnalysisService {
  private readonly analyzeSubjects = new Map<string, Subject<{ text: string; language: string }>>();
  private readonly immediateAnalyzeSubjects = new Map<string, Subject<{ text: string; language: string }>>();
  private readonly analyses = new Map<string, Observable<GenderBiasAnalysisResponse | undefined>>();
  private readonly lastLanguages = new Map<string, string>();
  private readonly firstLoads = new Set<string>();

  private readonly apiService = inject(GenderBiasAnalysisResourceApiService);

  getAnalysisForField(fieldId: string): Observable<GenderBiasAnalysisResponse | undefined> {
    if (!this.analyses.has(fieldId)) {
      const analyzeSubject = new Subject<{ text: string; language: string }>();
      const immediateAnalyzeSubject = new Subject<{ text: string; language: string }>();

      this.analyzeSubjects.set(fieldId, analyzeSubject);
      this.immediateAnalyzeSubjects.set(fieldId, immediateAnalyzeSubject);

      const analysis$ = merge(analyzeSubject.pipe(debounceTime(400)), immediateAnalyzeSubject).pipe(
        switchMap(({ text, language }) => {
          if (!text || text.trim() === '') {
            return of(undefined);
          }
          return this.analyzeHtmlContent({ text, language }).pipe(catchError(() => of(undefined)));
        }),
        shareReplay(1),
      );

      this.analyses.set(fieldId, analysis$);
    }

    return this.analyses.get(fieldId) ?? of(undefined);
  }

  analyzeHtmlContent(request: GenderBiasAnalysisRequest): Observable<GenderBiasAnalysisResponse> {
    return this.apiService.analyzeHtmlContent(request);
  }

  triggerAnalysis(fieldId: string, text: string, language: string): void {
    const lastLanguage = this.lastLanguages.get(fieldId);
    const isFirstLoad = !this.firstLoads.has(fieldId);

    const languageChanged = lastLanguage !== undefined && lastLanguage !== language;
    const shouldBeImmediate = languageChanged || isFirstLoad;

    const analyzeSubject = this.analyzeSubjects.get(fieldId);
    const immediateAnalyzeSubject = this.immediateAnalyzeSubjects.get(fieldId);

    if (!analyzeSubject || !immediateAnalyzeSubject) {
      this.getAnalysisForField(fieldId);
      this.triggerAnalysis(fieldId, text, language);
      return;
    }

    if (shouldBeImmediate) {
      immediateAnalyzeSubject.next({ text, language });
    } else {
      analyzeSubject.next({ text, language });
    }

    this.lastLanguages.set(fieldId, language);
    this.firstLoads.add(fieldId);
  }

  private getCodingFactor(coding: string | undefined): number {
    switch (coding) {
      case 'neutral':
        return CODING_FACTORS.neutral;
      case 'inclusive-coded':
        return CODING_FACTORS['inclusive-coded'];
      default:
        return CODING_FACTORS['non-inclusive-coded'];
    }
  }

  /**
   * Calculates the compliance score of a job posting based on the gender bias analysis.
   * The calculation is performed in several steps:
   * 1. If no analysis is available (or coding is 'empty'), it returns 100 if there is text, or 0 if content is empty.
   * 2. Calculates the ratio (`inclusiveWeight`) of inclusive words to the total number of flagged words (inclusive + non-inclusive)
   * 3. Applies a penalty factor based on the overall coding of the analysis:
   * - 'neutral-coded': 1.0 (no penalty)
   * - 'inclusive-coded': 0.9 (slight penalty)
   * - 'non-inclusive-coded': 0.2 (penalty)
   * 4. The final score is derived from the square root of (`inclusiveWeight` * factor) and scaled to a 0-100 range.
   * The square root is applied to soften the penalty curve and avoid overly harsh scores.
   *
   * TODO: Once AGG-compliance is implemented, extend to a geometric mean:
   * - sqrt(genderScore × complianceScore)
   * - Currently only genderScore is used.
   *
   * @param analysis - The result of the gender bias analysis (including identified words and overall coding).
   * @param htmlText - The raw text of the job posting in HTML format.
   * @returns An integer between 0 and 100 representing the inclusivity score.
   */
  calculateScore(analysis: GenderBiasAnalysisResponse | undefined, htmlText: string): number {
    if (!analysis || analysis.coding === 'empty') {
      const hasContent = extractTextFromHtml(htmlText).trim().length > 0;
      return hasContent ? 100 : 0;
    }

    const biasedWords = analysis.biasedWords ?? [];
    const inclusiveCount = biasedWords.filter(word => word.type === 'inclusive').length;
    const nonInclusiveCount = biasedWords.filter(word => word.type === 'non-inclusive').length;
    const totalCount = inclusiveCount + nonInclusiveCount;

    const inclusiveWeight = totalCount === 0 ? DEFAULT_INCLUSIVE_WEIGHT : inclusiveCount / totalCount;
    const factor = this.getCodingFactor(analysis.coding);
    const score = Math.sqrt(inclusiveWeight * factor) * 100;

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
