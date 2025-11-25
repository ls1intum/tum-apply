import { Component, ViewEncapsulation, input, output } from '@angular/core';
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

  onVisibleChange(isVisible: boolean): void {
    if (!isVisible) {
      this.visibleChange.emit(false);
      this.closeDialog.emit();
    }
  }

  getCodingTranslationKey(coding: string): string {
    switch (coding) {
      case 'masculine-coded':
        return 'genderDecoder.formulationTexts.manly';
      case 'feminine-coded':
        return 'genderDecoder.formulationTexts.feminine';
      case 'neutral':
        return 'genderDecoder.formulationTexts.neutral';
      case 'empty':
        return 'genderDecoder.formulationTexts.neutral';
      default:
        return 'genderDecoder.formulationTexts.neutral';
    }
  }

  getExplanationTranslationKey(coding: string): string {
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
  }

  getBiasTypeClass(type: string): string {
    return type === 'masculine' ? 'masculine-badge' : 'feminine-badge';
  }

  getMasculineWords(words: BiasedWordDTO[]): BiasedWordDTO[] {
    return words.filter(w => w.type === 'masculine');
  }

  getFeminineWords(words: BiasedWordDTO[]): BiasedWordDTO[] {
    return words.filter(w => w.type === 'feminine');
  }

  getWordCounts(words: BiasedWordDTO[]): Map<string, number> {
    const counts = new Map<string, number>();
    words.forEach(word => {
      if (word.word) {
        const current = counts.get(word.word) ?? 0;
        counts.set(word.word, current + 1);
      }
    });
    return counts;
  }

  getMasculineWordCounts(words: BiasedWordDTO[]): Map<string, number> {
    return this.getWordCounts(this.getMasculineWords(words));
  }

  getFeminineWordCounts(words: BiasedWordDTO[]): Map<string, number> {
    return this.getWordCounts(this.getFeminineWords(words));
  }
}
