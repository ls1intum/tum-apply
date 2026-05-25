import { Component, computed, inject, input, model } from '@angular/core';
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

  readonly likertValues: LikertValue[] = this.likertScale.map(s => s.value);

  readonly tooltipTexts = computed(() => {
    this.langChange();
    return this.likertScale.map(s => this.translateService.instant(`evaluation.ratings.${s.key}`) as string);
  });

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
        return 'var(--p-background-surface-alt)';
    }
  }

  getButtonBg(index: number): string {
    const entry = this.entryAt(index);
    if (entry === undefined) return 'var(--p-background-surface-alt)';
    return this.rating() === entry.value ? this.getColorForValue(entry.value) : 'var(--p-background-surface-alt)';
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

  private entryAt(index: number): LikertEntry | undefined {
    return this.likertScale.find((_, i) => i === index);
  }
}
