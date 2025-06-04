import { Component, computed, input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'jhi-rating',
  imports: [NgStyle],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.scss',
})
export class RatingComponent {
  rating = input<number | null>(null);
  likertScale = input<number>(5); // Likert 5 scale as default

  readonly min = computed(() => -Math.floor(this.likertScale() / 2));
  readonly max = computed(() => Math.floor(this.likertScale() / 2));

  readonly markerWidthPercent = computed(() => {
    return `${100 / this.likertScale() - 1}%`;
  });

  readonly offsetPercent = computed(() => {
    if (this.rating() === null) {
      return '';
    }
    const norm = ((this.rating() ?? 0) - this.min()) / this.likertScale();

    const half = 100 / (2 * this.likertScale());
    return `${norm * 100 + half}%`;
  });

  readonly backgroundColor = computed(() => {
    if (this.rating() === null) {
      return 'transparent';
    }
    const r = Math.min(Math.max(this.rating() ?? 0, this.min()), this.max());
    const mid = 0;
    if (r < mid) {
      const negSteps = mid - this.min();
      const depth = (mid - r) / negSteps;
      return this.lerpColor('#FF8C00', '#AC0C22', depth);
    } else if (r > mid) {
      const posSteps = this.max() - mid;
      const depth = (r - mid) / posSteps;
      return this.lerpColor('#A8E6A3', '#17723F', depth);
    } else {
      return '#FFBF0F';
    }
  });

  private lerpColor(c1: string, c2: string, t: number): string {
    const hex1 = c1.replace('#', '');
    const hex2 = c2.replace('#', '');
    const r1 = parseInt(hex1.slice(0, 2), 16);
    const g1 = parseInt(hex1.slice(2, 4), 16);
    const b1 = parseInt(hex1.slice(4, 6), 16);
    const r2 = parseInt(hex2.slice(0, 2), 16);
    const g2 = parseInt(hex2.slice(2, 4), 16);
    const b2 = parseInt(hex2.slice(4, 6), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const hex = (x: number) => x.toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }
}
