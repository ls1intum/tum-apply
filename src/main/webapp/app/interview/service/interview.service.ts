import {Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InterviewOverviewDTO {
  jobId: string;
  jobTitle: string;
  completedCount: number;
  scheduledCount: number;
  invitedCount: number;
  uncontactedCount: number;
  totalInterviews: number;
}

@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private http = inject(HttpClient);
  private baseUrl = 'api/interviews';

  /**
   * Get overview of all interview processes with statistics.
   */
  getInterviewOverview(): Observable<InterviewOverviewDTO[]> {
    return this.http.get<InterviewOverviewDTO[]>(`${this.baseUrl}/overview`);
  }
}
