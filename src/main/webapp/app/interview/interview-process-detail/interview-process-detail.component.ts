import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { SlotsSectionComponent } from './slots-section/slots-section.component';

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonComponent,
    SlotsSectionComponent,
  ],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewResourceApiService);

  processId = signal<string | null>(null);
  jobTitle = signal<string>('Interview Process');

  constructor() {
    const id = this.route.snapshot.paramMap.get('processId');
    if (id) {
      this.processId.set(id);

      // Try to get jobTitle from router state (faster on navigation)
      const state = window.history.state;
      if (state?.jobTitle) {
        this.jobTitle.set(state.jobTitle);
      } else {
        // Fallback: Load from backend (e.g., on page refresh)
        void this.loadJobTitle(id);
      }
    }
  }

  /**
   * Loads job title from backend when router state is not available
   */
  private async loadJobTitle(processId: string): Promise<void> {
    try {
      const overviews = await firstValueFrom(
        this.interviewService.getInterviewOverview()
      );

      const interviewProcess = overviews.find(ov => ov.processId === processId);

      if (interviewProcess?.jobTitle) {
        this.jobTitle.set(interviewProcess.jobTitle);
      }
    } catch (error) {
      console.error('Failed to load job title', error);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/interviews/overview']);
  }
}
