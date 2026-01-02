import { Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { BiasedWordDTO, GenderBiasAnalysisResponse } from 'app/generated';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-gender-bias-analysis-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, DialogModule, FontAwesomeModule, TooltipModule],
  templateUrl: './gender-bias-analysis-dialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class GenderBiasAnalysisDialogComponent {
  visible = input.required<boolean>();
  result = input<GenderBiasAnalysisResponse | null>(null);

  visibleChange = output<boolean>();
  closeDialog = output();

  readonly codingTranslationKey = computed(() => {
    const coding = this.result()?.coding;
    if (!coding) return 'genderDecoder.formulationTexts.neutral';

    switch (coding) {
      case 'non-inclusive-coded':
        return 'genderDecoder.formulationTexts.nonInclusive';
      case 'inclusive-coded':
        return 'genderDecoder.formulationTexts.inclusive';
      case 'neutral':
      case 'empty':
        return 'genderDecoder.formulationTexts.neutral';
      default:
        return 'genderDecoder.formulationTexts.neutral';
    }
  });

  readonly explanationTranslationKey = computed(() => {
    const coding = this.result()?.coding;
    if (!coding) return 'genderDecoder.explanations.neutral';

    switch (coding) {
      case 'non-inclusive-coded':
        return 'genderDecoder.explanations.non-inclusive-coded';
      case 'inclusive-coded':
        return 'genderDecoder.explanations.inclusive-coded';
      case 'neutral':
        return 'genderDecoder.explanations.neutral';
      case 'empty':
        return 'genderDecoder.explanations.empty';
      default:
        return 'genderDecoder.explanations.neutral';
    }
  });

  readonly nonInclusiveWords = computed(() => {
    const words = this.result()?.biasedWords ?? [];
    return words.filter(w => w.type === 'non-inclusive');
  });

  readonly inclusiveWords = computed(() => {
    const words = this.result()?.biasedWords ?? [];
    return words.filter(w => w.type === 'inclusive');
  });

  readonly nonInclusiveWordCounts = computed(() => {
    return this.getWordCounts(this.nonInclusiveWords());
  });

  readonly inclusiveWordCounts = computed(() => {
    return this.getWordCounts(this.inclusiveWords());
  });

  onVisibleChange(isVisible: boolean): void {
    if (!isVisible) {
      this.visibleChange.emit(false);
      this.closeDialog.emit();
    }
  }

  getBiasTypeClass(type: string): string {
    return type === 'non-inclusive' ? 'non-inclusive-badge' : 'inclusive-badge';
  }

  private getWordCounts(words: BiasedWordDTO[]): Map<string, number> {
    const counts = new Map<string, number>();
    words.forEach(word => {
      if (word.word) {
        const current = counts.get(word.word) ?? 0;
        counts.set(word.word, current + 1);
      }
    });
    return counts;
  }
}
