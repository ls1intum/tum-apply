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

  /** Map form — used by the template to avoid array[index] access. */
  readonly tooltipMap = computed<Map<LikertValue, string>>(() => {
    this.langChange();
    return new Map(
      this.likertScale.map(s => [s.value, this.translateService.instant(`evaluation.ratings.${s.key}`) as string]),
    );
  });

  /** Index of the button currently under the pointer, or null. */
  readonly hoveredIndex = signal<number | null>(null);

  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  onSectionClick(index: number): void {
    if (!this.selectable()) return;
    const entry = this.entryAt(index);
    if (entry === undefined) return;
    this.rating.set(this.rating() === entry.value ? undefined : entry.value);
  }

  getColorForValue(value: number): string {
    switch (value) {
      case -2: return 'var(--color-negative-active)';
      case -1: return 'var(--color-negative-hover)';
      case 0:  return 'var(--color-warning-default)';
      case 1:  return 'var(--color-positive-hover)';
      case 2:  return 'var(--color-positive-active)';
      default: return 'transparent';
    }
  }

  getButtonBg(index: number): string {
    const entry = this.entryAt(index);
    if (entry === undefined) return 'transparent';
    // Selected: full color
    if (this.rating() === entry.value) return this.getColorForValue(entry.value);
    // Hovered (selectable only): 15 % tint previewing the target color
    if (this.selectable() && this.hoveredIndex() === index) {
      return `color-mix(in srgb, ${this.getColorForValue(entry.value)} 15%, transparent)`;
    }
    return 'transparent';
  }

  getButtonTextColor(index: number): string {
    const entry = this.entryAt(index);
    if (entry === undefined) return 'var(--p-text-color)';
    return this.rating() === entry.value ? 'white' : 'var(--p-text-color)';
  }

  getSelectedLabel(): string {
    const r = this.rating();
    if (r === undefined) return '';
    const entry = this.likertScale.find(s => s.value === r);
    if (entry === undefined) return '';
    return this.translateService.instant(`evaluation.ratings.${entry.key}`) as string;
  }

  /** Safe lookup by loop index — avoids array[variable] bracket access. */
  private entryAt(index: number): LikertEntry | undefined {
    return this.likertScale.find((_, i) => i === index);
  }
}
