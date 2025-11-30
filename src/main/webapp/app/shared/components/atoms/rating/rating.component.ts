import { Component, input, model } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-rating',
  imports: [TooltipModule, TranslateModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss',
})
export class RatingComponent {
  rating = model<number | undefined>(undefined);
  selectable = input<boolean>(false);

  // Likert scale values from -2 to +2
  readonly likertValues = [-2, -1, 0, 1, 2];
  protected readonly Array = Array;

  private readonly tooltips = ['very_bad', 'bad', 'neutral', 'good', 'very_good'];

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
      return 'var(--color-background-surface-alt)';
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
    return 'var(--color-background-surface-alt)';
  }

  getTooltip(index: number): string {
    return `evaluation.ratings.${this.tooltips[index]}`;
  }

  getCursor(): string {
    return this.selectable() ? 'pointer' : 'default';
  }
}
