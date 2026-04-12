import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RatingComponent } from 'app/shared/components/atoms/rating/rating.component';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { RatingOverviewDTO } from 'app/generated/model/rating-overview-dto';
import { RatingResourceApi, getRatingsResource } from 'app/generated/api/rating-resource-api';

import TranslateDirective from '../../../language/translate.directive';
import { SubSection } from '../../atoms/sub-section/sub-section';

@Component({
  selector: 'jhi-rating-section',
  imports: [SubSection, RatingComponent, TranslateDirective],
  templateUrl: './rating-section.html',
})
export class RatingSection {
  ratingApi = inject(RatingResourceApi);
  accountService = inject(AccountService);
  toastService = inject(ToastService);

  applicationId = input<string | undefined>(undefined);
  ratings = signal<RatingOverviewDTO | undefined>(undefined);
  ratingUpdated = output();

  myRating = signal<number | undefined>(undefined);

  otherRatings = computed(() => {
    return this.ratings()?.otherRatings ?? [];
  });

  private safeApplicationId = computed(() => this.applicationId() ?? '');
  private ratingsResource = getRatingsResource(this.safeApplicationId);
  private pendingUpsert = signal(false);

  _loadRatingEffect = effect(() => {
    const applicationId = this.applicationId();
    if (applicationId !== undefined) {
      const response = this.ratingsResource.value();
      if (response) {
        this.ratings.set(response);
        const mine = response.currentUserRating ?? undefined;
        this.serverCurrent.set(mine);
        if (!this.pendingUpsert()) {
          this.isInitializing.set(true);
          this.myRating.set(mine);
          this.isInitializing.set(false);
        } else {
          this.myRating.set(mine);
          this.pendingUpsert.set(false);
          this.isInitializing.set(false);
          this.ratingUpdated.emit();
        }
      } else if (this.ratingsResource.error()) {
        this.toastService.showError({ summary: 'Error', detail: 'Failed to load ratings' });
        this.isInitializing.set(false);
      }
    }
  });

  _persistOnChangeEffect = effect(() => {
    const appId = this.applicationId();
    const value = this.myRating();

    if (appId === undefined) {
      return;
    }
    if (this.isInitializing()) return; // skip while we're syncing initial state
    if (value === this.serverCurrent()) return; // no-op if no real change

    untracked(() => {
      void this.upsertMyRating(appId, value);
    });
  });

  private serverCurrent = signal<number | undefined>(undefined);
  private isInitializing = signal<boolean>(true);

  private async upsertMyRating(applicationId: string, value: number | undefined): Promise<void> {
    try {
      await firstValueFrom(this.ratingApi.updateRating(applicationId, value));
      this.pendingUpsert.set(true);
      this.ratingsResource.reload();
    } catch {
      this.toastService.showError({ summary: 'Error', detail: 'Failed to save rating' });
      // revert UI to last known server value
      this.myRating.set(this.serverCurrent());
    }
  }
}
