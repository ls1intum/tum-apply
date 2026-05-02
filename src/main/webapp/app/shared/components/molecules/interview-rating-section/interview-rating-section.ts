import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RatingComponent } from 'app/shared/components/atoms/rating/rating.component';
import { ToastService } from 'app/service/toast-service';
import { InterviewResourceApi } from 'app/generated/api/interview-resource-api';

import { Section } from '../../atoms/section/section';
import { Prose } from '../../atoms/prose/prose';

@Component({
  selector: 'jhi-interview-rating-section',
  imports: [Section, RatingComponent, Prose],
  templateUrl: './interview-rating-section.html',
})
export class InterviewRatingSection {
  applicationId = input<string | undefined>(undefined);

  rating = signal<number | undefined>(undefined);
  assessmentNotes = signal<string | undefined>(undefined);
  hasRating = computed(() => this.rating() !== undefined);

  private readonly interviewApi = inject(InterviewResourceApi);
  private readonly toastService = inject(ToastService);

  private readonly _loadEffect = effect(() => {
    const id = this.applicationId();
    if (id !== undefined) {
      void this.loadInterviewReview(id);
    }
  });

  private async loadInterviewReview(applicationId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.interviewApi.getInterviewRatingForApplication(applicationId));
      this.rating.set(response.rating ?? undefined);
      this.assessmentNotes.set(response.assessmentNotes ?? undefined);
    } catch {
      this.toastService.showErrorKey('evaluation.errors.loadInterviewRating');
    }
  }
}
