import { Component, computed, inject, input, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-rating',
  templateUrl: './rating.component.html',
})
export class RatingComponent {
  rating = model<number | undefined>(undefined);
  selectable = input<boolean>(false);

  readonly likertValues = [-2, -1, 0, 1, 2];

  readonly tooltipTexts = computed(() => {
    this.langChange();
    return this.tooltipKeys.map(suffix => this.translateService.instant(`evaluation.ratings.${suffix}`));
  });

  private readonly tooltipKeys = ['very_bad', 'bad', 'neutral', 'good', 'very_good'];
  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  onSectionClick(index: number): void {
    if (!this.selectable()) return;
    const newRating = this.likertValues[index];
    this.rating.set(this.rating() === newRating ? undefined : newRating);
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
    if (index < 0 || index >= this.likertValues.length) return 'var(--p-background-surface-alt)';
    const sectionValue = this.likertValues[index];
    return this.rating() === sectionValue ? this.getColorForValue(sectionValue) : 'var(--p-background-surface-alt)';
  }

  getButtonTextColor(index: number): string {
    if (index < 0 || index >= this.likertValues.length) return 'var(--p-text-color)';
    return this.rating() === this.likertValues[index] ? 'white' : 'var(--p-text-color)';
  }

  getSelectedLabel(): string {
    const r = this.rating();
    if (r === undefined) return '';
    const idx = this.likertValues.indexOf(r);
    const texts = this.tooltipTexts();
    if (idx < 0 || idx >= texts.length) return '';
    return texts[idx] ?? '';
  }
}
