import { Component, computed, input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

/**
 * A visual rating bar component for displaying Likert-style ratings.
 *
 * Displays a colored marker on a horizontal scale, where both the position and color
 * reflect the given rating value.
 *
 * The marker's width and color are calculated dynamically based on the selected scale
 * (e.g., 5-point Likert, 7-point Likert) and the provided rating.
 *   -> The color is calculated using a dynamic gradient
 */
@Component({
  selector: 'jhi-rating',
  imports: [NgStyle, TranslateModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss',
})
export class RatingComponent {
  rating = input<number | null>(null);
  likertScale = input<number>(5); // Likert-5 scale as default

  readonly min = computed(() => -Math.floor(this.likertScale() / 2));
  readonly max = computed(() => Math.floor(this.likertScale() / 2));

  // fetching predefined color variables from preset
  readonly positiveStart = getComputedStyle(document.documentElement).getPropertyValue('--p-success-200').trim();
  readonly positiveEnd = getComputedStyle(document.documentElement).getPropertyValue('--p-success-700').trim();
  readonly negativeStart = getComputedStyle(document.documentElement).getPropertyValue('--p-warn-400').trim();
  readonly negativeEnd = getComputedStyle(document.documentElement).getPropertyValue('--p-danger-700').trim();
  readonly neutral = getComputedStyle(document.documentElement).getPropertyValue('--p-warn-500').trim();

  // compute width of inner rating marker | '-2%' is used for padding
  readonly markerWidthPercent = computed(() => {
    return `${100 / this.likertScale() - 2}%`;
  });

  // calculate offset of inner marker relative to the left end of the outer bar
  readonly offsetPercent = computed(() => {
    if (this.rating() === null) {
      return '';
    }
    const norm = ((this.rating() ?? 0) - this.min()) / this.likertScale();

    // Centering adjustment for marker position
    const half = 100 / (2 * this.likertScale());
    return `${norm * 100 + half}%`;
  });

  // Computes the background color based on the rating value:
  // - negative values use a gradient from negativeStart to negativeEnd
  // - positive values use a gradient from positiveStart to positiveEnd
  // - neutral uses a defined neutral color
  readonly backgroundColor = computed(() => {
    if (this.rating() === null) {
      return 'transparent';
    }

    const r = Math.min(Math.max(this.rating() ?? 0, this.min()), this.max());
    const mid = 0;

    if (r < mid) {
      const negSteps = mid - this.min();
      const depth = (mid - r) / negSteps;
      return this.lerpColor(this.negativeStart, this.negativeEnd, depth);
    } else if (r > mid) {
      const posSteps = this.max() - mid;
      const depth = (r - mid) / posSteps;
      return this.lerpColor(this.positiveStart, this.positiveEnd, depth);
    } else {
      return this.neutral;
    }
  });

  // Sets ARIA label translation key for accessibility
  readonly ariaParams = computed(() => {
    return this.rating() === null ? 'evaluation.noRating' : 'evaluation.ratingToolTip';
  });

  // Determines the label key based on rating value (positive/neutral/negative)
  readonly labelKey = computed(() => {
    const value = this.rating();
    if (value === null) return '';

    return value > 0 ? 'evaluation.positive' : value < 0 ? 'evaluation.negative' : 'evaluation.neutral';
  });

  /**
   * Linearly interpolates between two hex color strings (c1 and c2)
   * using a factor `t` (from 0 to 1), where 0 is all c1 and 1 is all c2.
   */
  private lerpColor(c1: string, c2: string, t: number): string {
    // Helper function to convert a hex color string to an array of RGB integers
    const parseHex = (hex: string): number[] => {
      const parts = hex.replace(/^#/, '').match(/.{2}/g);
      if (!parts || parts.length !== 3) return [0, 0, 0];
      return parts.map(h => parseInt(h, 16));
    };

    // Parse RGB values from the two input hex colors
    const [r1, g1, b1] = parseHex(c1.slice(1));
    const [r2, g2, b2] = parseHex(c2.slice(1));

    // Linear interpolation function between two values a and b
    const mix = (a: number, b: number): number => Math.round(a + (b - a) * t);

    // Interpolate RGB values and convert back to a padded hex string
    return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }
}
