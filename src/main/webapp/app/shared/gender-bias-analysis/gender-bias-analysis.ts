import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError, debounceTime, merge, of, shareReplay, switchMap } from 'rxjs';
import { GenderBiasAnalysisRequest, GenderBiasAnalysisResourceApiService, GenderBiasAnalysisResponse } from 'app/generated';

@Injectable({ providedIn: 'root' })
export class GenderBiasAnalysisService {
  private readonly analyzeSubjects = new Map<string, Subject<{ text: string; language: string }>>();
  private readonly immediateAnalyzeSubjects = new Map<string, Subject<{ text: string; language: string }>>();
  private readonly analyses = new Map<string, Observable<GenderBiasAnalysisResponse | null>>();
  private readonly lastLanguages = new Map<string, string>();
  private readonly firstLoads = new Set<string>();

  private readonly apiService = inject(GenderBiasAnalysisResourceApiService);

  getAnalysisForField(fieldId: string): Observable<GenderBiasAnalysisResponse | null> {
    if (!this.analyses.has(fieldId)) {
      const analyzeSubject = new Subject<{ text: string; language: string }>();
      const immediateAnalyzeSubject = new Subject<{ text: string; language: string }>();

      this.analyzeSubjects.set(fieldId, analyzeSubject);
      this.immediateAnalyzeSubjects.set(fieldId, immediateAnalyzeSubject);

      const analysis$ = merge(analyzeSubject.pipe(debounceTime(400)), immediateAnalyzeSubject).pipe(
        switchMap(({ text, language }) => {
          if (!text || text.trim() === '') {
            return of(null);
          }
          return this.analyzeHtmlContent({ text, language }).pipe(catchError(() => of(null)));
        }),
        shareReplay(1),
      );

      this.analyses.set(fieldId, analysis$);
    }

    return this.analyses.get(fieldId) ?? of(null);
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
}
