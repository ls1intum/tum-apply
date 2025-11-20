import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { GenderBiasAnalysisRequest, GenderBiasAnalysisResponse } from 'app/generated';

@Injectable({ providedIn: 'root' })
export class GenderBiasAnalysisService {
  readonly analyzeSubject = new Subject<{ text: string; language: string }>();

  /**
   * Observable für debounced Analyse
   */
  readonly analysis = this.analyzeSubject.pipe(
    debounceTime(1000),
    switchMap(({ text, language }) => {
      if (!text || text.trim() === '') {
        return of(null);
      }
      return this.analyzeHtmlContent({ text, language }).pipe(catchError(() => of(null)));
    }),
  );

  private readonly http = inject(HttpClient);
  private readonly resourceUrl = '/api/gender-bias';

  analyzeHtmlContent(request: GenderBiasAnalysisRequest): Observable<GenderBiasAnalysisResponse> {
    return this.http.post<GenderBiasAnalysisResponse>(`${this.resourceUrl}/analyze-html`, request);
  }

  triggerAnalysis(text: string, language: string): void {
    this.analyzeSubject.next({ text, language });
  }
}
