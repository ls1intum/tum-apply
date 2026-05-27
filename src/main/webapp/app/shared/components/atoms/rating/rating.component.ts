import { Component, computed, inject, input, model, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

type LikertValue = -2 | -1 | 0 | 1 | 2;

interface LikertEntry {
  value: LikertValue;
  key: string;
}

@Component({
  selector: 'jhi-rating',
  templateUrl: './rating.component.html',
})
export class RatingComponent {
  rating = model<number | undefined>(undefined);
  selectable = input<boolean>(false);

  readonly likertScale: LikertEntry[] = [
    { value: -2, key: 'very_bad' },
    { value: -1, key: 'bad' },
    { value: 0, key: 'neutral' },
    { value: 1, key: 'good' },
    { value: 2, key: 'very_good' },
  ];

  readonly tooltipTexts = computed(() => {
    this.langChange();
    return this.likertScale.map(s => this.translateService.instant(`evaluation.ratings.${s.key}`) as string);
  });

  /** Index of the button currently under the pointer, or null. */
  readonly hoveredIndex = signal<number | null>(null);

  readonly buttonStates = computed(() => {
    this.langChange();
    const currentRating = this.rating();
    const selectable = this.selectable();
    const hovered = this.hoveredIndex();

    return this.likertScale.map((entry, index) => {
      const color = this.colorForValue(entry.value);
      const label = this.translateService.instant(`evaluation.ratings.${entry.key}`) as string;
      const isSelected = currentRating === entry.value;
      const isHovered = selectable && hovered === index;

      let bg: string | null;
      if (isSelected) {
        bg = color;
      } else if (isHovered) {
        bg = `color-mix(in srgb, ${color} 15%, transparent)`;
      } else {
        bg = null;
      }

      return {
        entry,
        index,
        label,
        bg,
        borderColor: color,
        textColor: isSelected ? 'white' : 'var(--p-text-color)',
      };
    });
  });

  /** Badge data for the read-only display variant. */
  readonly selectedBadge = computed(() => {
    this.langChange();
    const r = this.rating();
    if (r === undefined) return undefined;
    const entry = this.likertScale.find(s => s.value === r);
    if (entry === undefined) return undefined;
    return {
      color: this.colorForValue(r),
      label: this.translateService.instant(`evaluation.ratings.${entry.key}`) as string,
    };
  });

  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  onSectionClick(index: number): void {
    if (!this.selectable()) return;
    const entry = this.likertScale.find((_, i) => i === index);
    if (entry === undefined) return;
    this.rating.set(this.rating() === entry.value ? undefined : entry.value);
  }

  /** Returns the CSS color variable for a Likert value, or null for undefined/unknown (no style set). */
  colorForValue(value: number | undefined): string | null {
    switch (value) {
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
      default:
        return null;
    }
  }
}
