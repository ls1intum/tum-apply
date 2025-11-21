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
    const mapping: Record<string, string> = {
      'masculine-coded': 'genderDecoder.formulationTexts.manly',
      'feminine-coded': 'genderDecoder.formulationTexts.feminine',
      neutral: 'genderDecoder.formulationTexts.neutral',
      empty: 'genderDecoder.formulationTexts.neutral',
    };
    return mapping[coding] || mapping['neutral'];
  }

  getExplanationTranslationKey(coding: string): string {
    const mapping: Record<string, string> = {
      'masculine-coded': 'genderDecoder.explanations.masculine-coded',
      'feminine-coded': 'genderDecoder.explanations.feminine-coded',
      neutral: 'genderDecoder.explanations.neutral',
      empty: 'genderDecoder.explanations.empty',
    };
    return mapping[coding] || mapping['neutral'];
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
