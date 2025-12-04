import { Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Dialog } from 'primeng/dialog';
import { BiasedWordDTO, GenderBiasAnalysisResponse } from 'app/generated';

@Component({
  selector: 'jhi-gender-bias-analysis-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, Dialog],
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
      case 'masculine-coded':
        return 'genderDecoder.formulationTexts.manly';
      case 'feminine-coded':
        return 'genderDecoder.formulationTexts.feminine';
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
      case 'masculine-coded':
        return 'genderDecoder.explanations.masculine-coded';
      case 'feminine-coded':
        return 'genderDecoder.explanations.feminine-coded';
      case 'neutral':
        return 'genderDecoder.explanations.neutral';
      case 'empty':
        return 'genderDecoder.explanations.empty';
      default:
        return 'genderDecoder.explanations.neutral';
    }
  });

  readonly masculineWords = computed(() => {
    const words = this.result()?.biasedWords ?? [];
    return words.filter(w => w.type === 'masculine');
  });

  readonly feminineWords = computed(() => {
    const words = this.result()?.biasedWords ?? [];
    return words.filter(w => w.type === 'feminine');
  });

  readonly masculineWordCounts = computed(() => {
    return this.getWordCounts(this.masculineWords());
  });

  readonly feminineWordCounts = computed(() => {
    return this.getWordCounts(this.feminineWords());
  });

  onVisibleChange(isVisible: boolean): void {
    if (!isVisible) {
      this.visibleChange.emit(false);
      this.closeDialog.emit();
    }
  }

  getBiasTypeClass(type: string): string {
    return type === 'masculine' ? 'masculine-badge' : 'feminine-badge';
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
