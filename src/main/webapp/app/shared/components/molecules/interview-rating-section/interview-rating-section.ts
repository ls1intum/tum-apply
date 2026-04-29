import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RatingComponent } from 'app/shared/components/atoms/rating/rating.component';
import { ToastService } from 'app/service/toast-service';
import { InterviewResourceApi } from 'app/generated/api/interview-resource-api';

import { SubSection } from '../../atoms/sub-section/sub-section';

@Component({
  selector: 'jhi-interview-rating-section',
  imports: [SubSection, RatingComponent],
  templateUrl: './interview-rating-section.html',
})
export class InterviewRatingSection {
  applicationId = input<string | undefined>(undefined);

  rating = signal<number | undefined>(undefined);
  hasRating = computed(() => this.rating() !== undefined);

  private readonly interviewApi = inject(InterviewResourceApi);
  private readonly toastService = inject(ToastService);

  private readonly _loadEffect = effect(() => {
    const id = this.applicationId();
    if (id !== undefined) {
      void this.loadRating(id);
    }
  });

  private async loadRating(applicationId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.interviewApi.getInterviewRatingForApplication(applicationId));
      this.rating.set(response.rating ?? undefined);
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'Failed to load interview rating' });
    }
  }
}
