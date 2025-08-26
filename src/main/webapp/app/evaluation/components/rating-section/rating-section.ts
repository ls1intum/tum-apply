import { Component, WritableSignal, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SubSection } from '../sub-section/sub-section';
import { RatingComponent } from '../../../shared/components/atoms/rating/rating.component';
import { RatingOverviewDTO, RatingResourceService } from '../../../generated';
import { AccountService, User } from '../../../core/auth/account.service';
import { ToastService } from '../../../service/toast-service';

@Component({
  selector: 'jhi-rating-section',
  imports: [SubSection, RatingComponent],
  templateUrl: './rating-section.html',
})
export class RatingSection {
  ratingService = inject(RatingResourceService);
  accountService = inject(AccountService);
  toastService = inject(ToastService);

  currentUser: WritableSignal<User | undefined> = this.accountService.user;
  applicationId = signal<string | undefined>(undefined);
  ratings = signal<RatingOverviewDTO | undefined>(undefined);

  loadRaringEffect = effect(() => {
    const applicationId = this.applicationId();

    if (applicationId !== undefined) {
      void this.loadRatings(applicationId);
    }
  });

  private async loadRatings(applicationId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.ratingService.getRatings(applicationId));
      this.ratings.set(response);
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'Failed to load ratings' });
    }
  }
}
