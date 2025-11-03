import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated/api/interviewResourceApi.service';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { InterviewProcessDTO } from 'app/generated/model/interviewProcessDTO';
import { CreateInterviewProcessDTO } from 'app/generated/model/createInterviewProcessDTO';

@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private readonly interviewResourceApiService = inject(InterviewResourceApiService);

  /**
   * Get overview of all interview processes with statistics.
   */
  getInterviewOverview(): Observable<InterviewOverviewDTO[]> {
    return this.interviewResourceApiService.getInterviewOverview();
  }

  /**
   * Create a new interview process for a job.
   */
  createInterviewProcess(jobId: string): Observable<InterviewProcessDTO> {
    const dto: CreateInterviewProcessDTO = { jobId };
    return this.interviewResourceApiService.createInterviewProcess(dto);
  }
}
