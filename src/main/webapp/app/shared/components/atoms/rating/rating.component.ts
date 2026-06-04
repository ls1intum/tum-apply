import { Component, computed, inject, input, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

type LikertValue = -2 | -1 | 0 | 1 | 2;

interface LikertEntry {
  value: LikertValue;
  key: string;
}

interface VariantClasses {
  bg: string;
  hoverBg: string;
  textOn: string;
}

const VARIANT_CLASSES: Record<LikertValue, VariantClasses> = {
  [-2]: { bg: 'bg-negative-active', hoverBg: 'hover:bg-negative-active/15', textOn: 'text-text-on-danger' },
  [-1]: { bg: 'bg-negative-hover', hoverBg: 'hover:bg-negative-hover/15', textOn: 'text-text-on-danger' },
  [0]: { bg: 'bg-warning-default', hoverBg: 'hover:bg-warning-default/15', textOn: 'text-text-on-warn' },
  [1]: { bg: 'bg-positive-hover', hoverBg: 'hover:bg-positive-hover/15', textOn: 'text-text-on-success' },
  [2]: { bg: 'bg-positive-active', hoverBg: 'hover:bg-positive-active/15', textOn: 'text-text-on-success' },
};

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
    return this.likertScale.map(s => {
      const tooltip: string = this.translateService.instant(`evaluation.ratings.${s.key}`);
      return tooltip;
    });
  });

  readonly buttonStates = computed(() => {
    this.langChange();
    const currentRating = this.rating();

    return this.likertScale.map((entry, index) => {
      const label: string = this.translateService.instant(`evaluation.ratings.${entry.key}`);
      const isSelected = currentRating === entry.value;
      const variant = VARIANT_CLASSES[entry.value];
      const classes: string = isSelected ? `${variant.bg} ${variant.textOn}` : variant.hoverBg;

      return { entry, index, label, classes };
    });
  });

  readonly selectedBadge = computed(() => {
    this.langChange();
    const r = this.rating();
    if (r === undefined) return undefined;
    const entry = this.likertScale.find(s => s.value === r);
    if (entry === undefined) return undefined;
    const label: string = this.translateService.instant(`evaluation.ratings.${entry.key}`);
    const variant = VARIANT_CLASSES[entry.value];
    return { classes: `${variant.bg} ${variant.textOn}`, label };
  });

  private translateService = inject(TranslateService);
  private langChange = toSignal(this.translateService.onLangChange, { initialValue: undefined });

  onSectionClick(index: number): void {
    if (!this.selectable()) return;
    const entry = this.likertScale.find((_, i) => i === index);
    if (entry === undefined) return;
    this.rating.set(this.rating() === entry.value ? undefined : entry.value);
  }
}
