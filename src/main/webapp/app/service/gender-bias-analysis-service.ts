import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, catchError, debounceTime, merge, of, switchMap } from 'rxjs';
import { GenderBiasAnalysisRequest, GenderBiasAnalysisResponse } from 'app/generated';

@Injectable({ providedIn: 'root' })
export class GenderBiasAnalysisService {
  readonly analyzeSubject = new Subject<{ text: string; language: string }>();
  readonly immediateAnalyzeSubject = new Subject<{ text: string; language: string }>();

  /**
   * Observable for debounced Analysis
   */
  readonly analysis = merge(this.analyzeSubject.pipe(debounceTime(400)), this.immediateAnalyzeSubject).pipe(
    switchMap(({ text, language }) => {
      if (!text || text.trim() === '') {
        return of(null);
      }
      return this.analyzeHtmlContent({ text, language }).pipe(catchError(() => of(null)));
    }),
  );

  private readonly http = inject(HttpClient);
  private readonly resourceUrl = '/api/gender-bias';
  private lastLanguage: string | null = null;
  private isFirstLoad = true;

  analyzeHtmlContent(request: GenderBiasAnalysisRequest): Observable<GenderBiasAnalysisResponse> {
    return this.http.post<GenderBiasAnalysisResponse>(`${this.resourceUrl}/analyze-html`, request);
  }

  triggerAnalysis(text: string, language: string): void {
    const languageChanged = this.lastLanguage !== null && this.lastLanguage !== language;
    const shouldBeImmediate = languageChanged || this.isFirstLoad;

    if (shouldBeImmediate) {
      this.immediateAnalyzeSubject.next({ text, language });
    } else {
      this.analyzeSubject.next({ text, language });
    }

    this.lastLanguage = language;
    this.isFirstLoad = false;
  }
}
