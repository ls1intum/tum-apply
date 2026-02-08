import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Component that displays a star rating on a 1-5 scale.
 * Shows filled and half-filled stars based on the rating value.
 */
@Component({
  selector: 'jhi-star-rating',
  imports: [FontAwesomeModule, TranslateModule],
  templateUrl: './star-rating.component.html',
})
export class StarRatingComponent {
  /**
   * The rating value on a 1-5 scale (can include decimals).
   * If undefined or null, no rating is displayed.
   */
  rating = input<number | undefined>(undefined);

  /**
   * Number of stars to display (default: 5)
   */
  maxStars = input<number>(5);

  /**
   * Size of the stars: 'small' | 'medium' | 'large'
   */
  size = input<'small' | 'medium' | 'large'>('medium');

  /**
   * Whether to show the numeric rating value next to the stars
   */
  showValue = input<boolean>(true);

  /**
   * Gets the array of star indices for iteration
   */
  get starIndices(): number[] {
    return Array.from({ length: this.maxStars() }, (_, i) => i);
  }

  /**
   * Determines which icon to show for a star at the given index.
   * Returns 'star' (filled), 'star-half-stroke' (half), or 'star' with empty class (empty)
   */
  getStarIcon(index: number): string {
    const rating = this.rating();
    if (rating === undefined) {
      return 'star';
    }

    const diff = rating - index;

    if (diff >= 1) {
      return 'star'; // filled star
    } else if (diff >= 0.5) {
      return 'star-half-stroke'; // half star
    } else {
      return 'star'; // empty star
    }
  }

  /**
   * Determines if the star should be filled or empty
   */
  isStarFilled(index: number): boolean {
    const rating = this.rating();
    if (rating === undefined) {
      return false;
    }

    return rating > index;
  }

  /**
   * Checks if the star should be half-filled
   */
  isStarHalf(index: number): boolean {
    const rating = this.rating();
    if (rating === undefined) {
      return false;
    }

    const diff = rating - index;
    return diff >= 0.5 && diff < 1;
  }

  /**
   * Formats the rating value for display
   */
  get formattedRating(): string | undefined {
    const rating = this.rating();
    if (rating === undefined) {
      return undefined;
    }

    return rating.toFixed(1);
  }

  /**
   * Gets the color for filled/half stars based on the rating value.
   * Maps 1-5 scale to Likert scale colors (-2 to +2):
   * 1-1.49 → red (negative-active)
   * 1.5-2.49 → light red (negative-hover)
   * 2.5-3.49 → yellow (warning)
   * 3.5-4.49 → light green (positive-hover)
   * 4.5-5 → dark green (positive-active)
   */
  getStarColor(): string {
    const rating = this.rating();
    if (rating === undefined) {
      return 'var(--p-primary-color)';
    }

    // Round to nearest 0.5 to map to closest Likert value
    const rounded = Math.round(rating * 2) / 2;

    if (rounded < 1.5) {
      return 'var(--color-negative-active)'; // 1-1.49 → -2 (dark red)
    } else if (rounded < 2.5) {
      return 'var(--color-negative-hover)'; // 1.5-2.49 → -1 (light red)
    } else if (rounded < 3.5) {
      return 'var(--color-warning-default)'; // 2.5-3.49 → 0 (yellow)
    } else if (rounded < 4.5) {
      return 'var(--color-positive-hover)'; // 3.5-4.49 → 1 (light green)
    } else {
      return 'var(--color-positive-active)'; // 4.5-5 → 2 (dark green)
    }
  }
}
