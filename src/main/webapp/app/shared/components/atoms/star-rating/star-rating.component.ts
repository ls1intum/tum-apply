import { Component, computed, input } from '@angular/core';
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
   * Calculates filled/half state for each star only when rating or maxStars changes.
   */
  starStates = computed(() => {
    const rating = this.rating();
    const maxStars = this.maxStars();

    return Array.from({ length: maxStars }, (_, index) => {
      if (rating === undefined) {
        return { filled: false, half: false, icon: 'star' };
      }

      const diff = rating - index;
      const icon = diff >= 1 ? 'star' : diff >= 0.5 ? 'star-half-stroke' : 'star';
      return {
        filled: diff >= 1,
        half: diff >= 0.5 && diff < 1,
        icon,
      };
    });
  });

  /**
   * Formats the rating value for display
   */
  formattedRating = computed<string | undefined>(() => {
    const rating = this.rating();
    if (rating === undefined) {
      return undefined;
    }

    return rating.toFixed(1);
  });

  /**
   * Gets the color for filled/half stars based on the rating value.
   * Maps 1-5 scale to Likert scale colors (-2 to +2):
   * 1-1.49 → red (negative-active)
   * 1.5-2.49 → light red (negative-hover)
   * 2.5-3.49 → yellow (warning)
   * 3.5-4.49 → light green (positive-hover)
   * 4.5-5 → dark green (positive-active)
   */
  starColor = computed<string>(() => {
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
  });
}
