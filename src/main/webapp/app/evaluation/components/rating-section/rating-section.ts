import { Component, WritableSignal, computed, effect, inject, input, signal, untracked } from '@angular/core';
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
  applicationId = input<string | undefined>(undefined);
  ratings = signal<RatingOverviewDTO | undefined>(undefined);

  myRating = signal<number | undefined>(undefined);

  otherRatings = computed(() => {
    return this.ratings()?.otherRatings ?? [];
  });

  _loadRaringEffect = effect(() => {
    const applicationId = this.applicationId();
    if (applicationId !== undefined) {
      void this.loadRatings(applicationId);
    }
  });

  _persistOnChangeEffect = effect(() => {
    const appId = this.applicationId();
    const value = this.myRating();

    if (appId === undefined) {
      return;
    }
    if (this.isInitializing()) return; // skip while we’re syncing initial state
    if (value === this.serverCurrent()) return; // no-op if no real change

    untracked(() => {
      void this.upsertMyRating(appId, value);
    });
  });

  private serverCurrent = signal<number | undefined>(undefined);
  private isInitializing = signal<boolean>(true);

  private async loadRatings(applicationId: string): Promise<void> {
    this.isInitializing.set(true);
    try {
      const response = await firstValueFrom(this.ratingService.getRatings(applicationId));
      this.ratings.set(response);

      // Initialize myRating from server (e.g. response.currentUserRating)
      const mine = response.currentUserRating ?? undefined;
      this.serverCurrent.set(mine);
      this.myRating.set(mine);
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'Failed to load ratings' });
    } finally {
      this.isInitializing.set(false);
    }
  }

  private async upsertMyRating(applicationId: string, value: number | undefined): Promise<void> {
    try {
      await firstValueFrom(this.ratingService.updateRating(applicationId, value));

      this.serverCurrent.set(value);

      const refreshed = await firstValueFrom(this.ratingService.getRatings(applicationId));
      this.ratings.set(refreshed);
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'Failed to save rating' });
      // revert UI to last known server value
      this.myRating.set(this.serverCurrent());
    }
  }
}
