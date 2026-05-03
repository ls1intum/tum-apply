import { Component, computed, inject, input, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-rating',
  imports: [TooltipModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss',
})
export class RatingComponent {
  rating = model<number | undefined>(undefined);
  selectable = input<boolean>(false);

  // Likert scale values from -2 to +2
  readonly likertValues = [-2, -1, 0, 1, 2];

  readonly tooltipTexts = computed(() => {
    this.langChange();
    return this.tooltipKeys.map(suffix => this.translateService.instant(`evaluation.ratings.${suffix}`));
  });

  protected readonly Array = Array;

  private readonly tooltipKeys = ['very_bad', 'bad', 'neutral', 'good', 'very_good'];
  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  onSectionClick(index: number): void {
    if (!this.selectable()) {
      return;
    }

    const newRating = this.likertValues[index];
    // If clicking the same rating, unselect it
    if (this.rating() === newRating) {
      this.rating.set(undefined);
    } else {
      this.rating.set(newRating);
    }
  }

  getSectionColor(index: number): string {
    const currentRating = this.rating();
    const sectionValue = this.likertValues[index];

    if (currentRating === undefined) {
      return 'var(--p-background-surface-alt)';
    }

    if (sectionValue === currentRating) {
      switch (sectionValue) {
        case -2:
          return 'var(--color-negative-active)';
        case -1:
          return 'var(--color-negative-hover)';
        case 0:
          return 'var(--color-warning-default)';
        case 1:
          return 'var(--color-positive-hover)';
        case 2:
          return 'var(--color-positive-active)';
      }
    }
    return 'var(--p-background-surface-alt)';
  }

  getCursor(): string {
    return this.selectable() ? 'pointer' : 'default';
  }
}
