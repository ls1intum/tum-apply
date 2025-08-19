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

  readonly likertScale = 5;
  protected readonly Array = Array;

  private readonly tooltips = ['very_bad', 'bad', 'neutral', 'good', 'very_good'];

  onSectionClick(index: number): void {
    if (!this.selectable()) {
      return;
    }

    const newRating = index + 1;
    // If clicking the same rating, unselect it
    if (this.rating() === newRating) {
      this.rating.set(undefined);
    } else {
      this.rating.set(newRating);
    }
  }

  getSectionColor(index: number): string {
    const currentRating = this.rating();

    if (currentRating === undefined) {
      return 'var(--p-background-surface-alt)';
    }

    if (index === currentRating - 1) {
      // Color based on rating level
      switch (currentRating) {
        case 1:
          return 'var(--p-danger-active-color)';
        case 2:
          return 'var(--p-danger-hover-color)';
        case 3:
          return 'var(--p-warn-color)';
        case 4:
          return 'var(--p-success-hover-color)';
        case 5:
          return 'var(--p-success-active-color)';
        default:
          return 'var(--p-background-surface-alt)';
      }
    }
    return 'var(--p-background-surface-alt)';
  }

  getTooltip(index: number): string {
    return `evaluation.ratings.${this.tooltips[index]}`;
  }

  getCursor(): string {
    return this.selectable() ? 'pointer' : 'default';
  }
}
