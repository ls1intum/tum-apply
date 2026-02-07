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
}
