import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { SlotsSectionComponent } from './slots-section/slots-section.component';

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
    SlotsSectionComponent,
    // IntervieweesSectionComponent, // ← TODO: Später hinzufügen
  ],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewResourceApiService);

  processId = signal<string | null>(null);
  jobTitle = signal<string>('Interview Process'); // Fallback Title

  constructor() {
    // Get processId from route
    const id = this.route.snapshot.paramMap.get('processId');
    if (id) {
      this.processId.set(id);

      // Versuche jobTitle aus router state zu holen
      const state = window.history.state;
      if (state?.jobTitle) {
        this.jobTitle.set(state.jobTitle);
      } else {
        // Lade im Hintergrund vom Backend (bei Refresh)
        void this.loadJobTitle(id);
      }
    }
  }

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
      // Behalte Fallback "Interview Process"
    }
  }

  navigateBack(): void {
    this.router.navigate(['/interviews/overview']);
  }
}
