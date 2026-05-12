import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { BiasedIssue } from 'app/generated/model/biased-issue';
import { ComponentRef } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { GenderBiasAnalysisDialogComponent } from 'app/shared/gender-bias-analysis/gender-bias-analysis-dialog/gender-bias-analysis-dialog';

type GenderBiasAnalysisDialogTestResult = Omit<BiasedIssue, 'type'> & {
  type?: BiasedIssue['type'] | 'non-inclusive' | 'nonInclusive' | 'inclusive' | 'male';
  biasedWords?: GenderBiasAnalysisDialogTestResult[];
};

describe('GenderBiasAnalysisDialogComponent', () => {
  let translateService: TranslateServiceMock;

  beforeEach(async () => {
    translateService = createTranslateServiceMock();
    await TestBed.configureTestingModule({
      imports: [GenderBiasAnalysisDialogComponent],
      providers: [provideTranslateMock(translateService), provideFontAwesomeTesting(), provideNoopAnimations()],
    }).compileComponents();
  });

  function createComponentWithInputs(
    visible: boolean,
    result: GenderBiasAnalysisDialogTestResult | BiasedIssue[] | undefined = undefined,
  ): {
    fixture: ComponentFixture<GenderBiasAnalysisDialogComponent>;
    component: GenderBiasAnalysisDialogComponent;
  } {
    const fixture = TestBed.createComponent(GenderBiasAnalysisDialogComponent);
    const componentRef = fixture.componentRef as ComponentRef<GenderBiasAnalysisDialogComponent>;
    componentRef.setInput('visible', visible);
    if (result !== undefined) {
      componentRef.setInput('result', Array.isArray(result) ? result : normalizeResult(result));
    }
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  function normalizeResult(result: GenderBiasAnalysisDialogTestResult): BiasedIssue[] {
    if (result.biasedWords && result.biasedWords.length > 0) {
      return result.biasedWords.map(word => toBiasedIssue(word, result.coding));
    }

    return [toBiasedIssue(result)];
  }

  function toBiasedIssue(result: GenderBiasAnalysisDialogTestResult, coding = result.coding): BiasedIssue {
    return {
      coding,
      word: result.word,
      type: normalizeType(result.type),
    };
  }

  function normalizeType(type: GenderBiasAnalysisDialogTestResult['type']): BiasedIssue['type'] | undefined {
    switch (type) {
      case 'non-inclusive':
      case 'nonInclusive':
        return 'NON_INCLUSIVE';
      case 'inclusive':
        return 'INCLUSIVE';
      default:
        return type as BiasedIssue['type'] | undefined;
    }
  }

  it('should create', () => {
    const { component } = createComponentWithInputs(true);
    expect(component).toBeTruthy();
  });

  describe('onVisibleChange', () => {
    it('should emit visibleChange and closeDialog when visibility is set to false', () => {
      const { component } = createComponentWithInputs(true);
      const visibleChangeSpy = vi.fn();
      const closeDialogSpy = vi.fn();
      component.visibleChange.subscribe(visibleChangeSpy);
      component.closeDialog.subscribe(closeDialogSpy);

      component.onVisibleChange(false);

      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
      expect(closeDialogSpy).toHaveBeenCalledOnce();
    });

    it('should not emit when visibility is set to true', () => {
      const { component } = createComponentWithInputs(true);
      const visibleChangeSpy = vi.fn();
      const closeDialogSpy = vi.fn();
      component.visibleChange.subscribe(visibleChangeSpy);
      component.closeDialog.subscribe(closeDialogSpy);

      component.onVisibleChange(true);

      expect(visibleChangeSpy).not.toHaveBeenCalled();
      expect(closeDialogSpy).not.toHaveBeenCalled();
    });
  });

  describe('codingTranslationKey computed', () => {
    it('should return correct key for non-inclusive-coded', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.nonInclusive');
    });

    it('should return correct key for inclusive-coded', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'inclusive-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.inclusive');
    });

    it('should return correct key for neutral', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'neutral',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return correct key for empty', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'empty',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return neutral key for unknown coding', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'unknown-type' as any,
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return neutral key when result is undefined', () => {
      const { component } = createComponentWithInputs(true, undefined);
      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return neutral key when coding is undefined', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: undefined,
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });
  });

  describe('explanationTranslationKey computed', () => {
    it('should return correct key for non-inclusive-coded', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.non-inclusive-coded');
    });

    it('should return correct key for inclusive-coded', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'inclusive-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.inclusive-coded');
    });

    it('should return correct key for neutral', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'neutral',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.neutral');
    });

    it('should return correct key for empty', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'empty',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.empty');
    });

    it('should return neutral explanation key for unknown coding', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'unknown-type' as any,
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.neutral');
    });

    it('should return neutral key when result is undefined', () => {
      const { component } = createComponentWithInputs(true, undefined);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.neutral');
    });
  });

  describe('getBiasTypeClass', () => {
    it.each([
      ['non-inclusive', 'non-inclusive-badge'],
      ['inclusive', 'inclusive-badge'],
      ['neutral', 'inclusive-badge'],
      ['', 'inclusive-badge'],
    ])('should map type "%s" to "%s"', (type, expected) => {
      const { component } = createComponentWithInputs(true);
      expect(component.getBiasTypeClass(type)).toBe(expected);
    });
  });

  describe('word filters and counts', () => {
    it('should filter biased words by inclusive vs non-inclusive type', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'non-inclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'decisive', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.nonInclusiveWords();

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe('leader');
      expect(result[1].word).toBe('decisive');
    });

    it('should return empty array when no non-inclusive words exist', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'inclusive-coded',
        biasedWords: [
          { word: 'supportive', type: 'inclusive' },
          { word: 'caring', type: 'inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.nonInclusiveWords()).toHaveLength(0);
    });

    it('should return empty array when biasedWords is undefined', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'neutral',
        biasedWords: undefined,
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.nonInclusiveWords()).toHaveLength(0);
    });

    it('should return empty array when result is undefined', () => {
      const { component } = createComponentWithInputs(true, undefined);

      expect(component.nonInclusiveWords()).toHaveLength(0);
    });
  });

  describe('inclusiveWords computed', () => {
    it('should filter and return only inclusive words', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'nonInclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'caring', type: 'inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.inclusiveWords();

    it('should return empty arrays/maps when result or biasedWords is undefined', () => {
      const { component: noResult } = createComponentWithInputs(true, undefined);
      expect(noResult.nonInclusiveWords()).toHaveLength(0);
      expect(noResult.inclusiveWords()).toHaveLength(0);

      const { component: noBiased } = createComponentWithInputs(true, { coding: 'neutral', biasedWords: undefined });
      expect(noBiased.nonInclusiveWords()).toHaveLength(0);
      expect(noBiased.nonInclusiveWordCounts().size).toBe(0);
    });

    it('should return empty array when no inclusive words exist', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'nonInclusive' },
          { word: 'decisive', type: 'nonInclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.inclusiveWords()).toHaveLength(0);
    });

    it('should return empty array when biasedWords is undefined', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'neutral',
        biasedWords: undefined,
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.inclusiveWords()).toHaveLength(0);
    });
  });

  describe('nonInclusiveWordCounts computed', () => {
    it('should return word counts for non-inclusive words only', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'non-inclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'leader', type: 'non-inclusive' },
          { word: 'decisive', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.nonInclusiveWordCounts();

      expect(result.get('leader')).toBe(2);
      expect(result.get('decisive')).toBe(1);
      expect(result.get('supportive')).toBeUndefined();
    });

    it('should return empty map when no nonInclusive words exist', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'inclusive-coded',
        biasedWords: [
          { word: 'supportive', type: 'inclusive' },
          { word: 'caring', type: 'inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.nonInclusiveWordCounts().size).toBe(0);
    });

    it('should handle words with undefined word property', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'non-inclusive' },
          { word: undefined, type: 'non-inclusive' },
          { word: 'leader', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.nonInclusiveWordCounts();

      expect(result.get('leader')).toBe(2);
      expect(result.get('undefined')).toBeUndefined();
    });
  });

  describe('inclusiveWordCounts computed', () => {
    it('should return word counts for inclusive words only', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'nonInclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'caring', type: 'inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.inclusiveWordCounts();

      expect(result.get('supportive')).toBe(2);
      expect(result.get('caring')).toBe(1);
      expect(result.get('leader')).toBeUndefined();
    });

    it('should return empty map when no inclusive words exist', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'nonInclusive' },
          { word: 'decisive', type: 'nonInclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.inclusiveWordCounts().size).toBe(0);
    });
  });

  describe('component inputs and outputs', () => {
    it('should accept visible input', () => {
      const { component } = createComponentWithInputs(true);
      expect(component.visible()).toBe(true);
    });

    it('should accept result input', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        word: 'leader',
        type: 'NON_INCLUSIVE',
      };

      const { component } = createComponentWithInputs(true, mockResult);
      expect(component.result()).toEqual([mockResult]);
    });

    it('should handle undefined result input', () => {
      const { component } = createComponentWithInputs(true, undefined);
      expect(component.result()).toEqual([]);
    });

    it('should change visible input value', () => {
      const { fixture, component } = createComponentWithInputs(true);
      expect(component.visible()).toBe(true);

      const componentRef = fixture.componentRef as ComponentRef<GenderBiasAnalysisDialogComponent>;
      componentRef.setInput('visible', false);
      fixture.detectChanges();

      expect(component.visible()).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete non-inclusive-coded analysis result', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'non-inclusive' },
          { word: 'decisive', type: 'non-inclusive' },
          { word: 'leader', type: 'non-inclusive' },
        ],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.nonInclusive');
      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.non-inclusive-coded');
      expect(component.nonInclusiveWordCounts().get('leader')).toBe(2);
      expect(component.nonInclusiveWordCounts().get('decisive')).toBe(1);
    });

    it('should handle complete inclusive-coded analysis result', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'inclusive-coded',
        biasedWords: [
          { word: 'supportive', type: 'inclusive' },
          { word: 'caring', type: 'inclusive' },
          { word: 'supportive', type: 'inclusive' },
        ],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.inclusive');
      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.inclusive-coded');
      expect(component.inclusiveWords()).toHaveLength(3);
      expect(component.inclusiveWordCounts().get('supportive')).toBe(2);
      expect(component.inclusiveWordCounts().get('caring')).toBe(1);
    });

    it('should handle mixed biased words result', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'non-inclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'decisive', type: 'non-inclusive' },
          { word: 'caring', type: 'inclusive' },
        ],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.nonInclusiveWords()).toHaveLength(2);
      expect(component.inclusiveWords()).toHaveLength(2);
    });

    it('should handle neutral result with no biased words', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'neutral',
        biasedWords: [],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
      expect(component.nonInclusiveWords()).toHaveLength(0);
      expect(component.inclusiveWords()).toHaveLength(0);
    });

    it('should handle empty result', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'empty',
        biasedWords: undefined,
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.empty');
    });
  });

  describe('edge cases', () => {
    it('should handle words with special characters', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader-like', type: 'non-inclusive' },
          { word: "leader's", type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.nonInclusiveWordCounts();
      expect(counts.get('leader')).toBe(2);
      expect(counts.get('decisive')).toBe(1);
      expect(counts.get('supportive')).toBeUndefined();
    });

    it('should case-sensitively count distinct words and ignore empty strings', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'Leader', type: 'non-inclusive' },
          { word: 'leader', type: 'non-inclusive' },
          { word: 'LEADER', type: 'non-inclusive' },
          { word: '', type: 'non-inclusive' },
          { word: '   ', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.nonInclusiveWordCounts();
      expect(counts.get('Leader')).toBe(1);
      expect(counts.get('leader')).toBe(1);
      expect(counts.get('LEADER')).toBe(1);
    });

    it('should handle empty string as word', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: '', type: 'non-inclusive' },
          { word: 'leader', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.nonInclusiveWordCounts();

      expect(counts.get('')).toBeUndefined();
      expect(counts.get('leader')).toBe(1);
    });

    it('should handle whitespace-only words', () => {
      const mockResult: GenderBiasAnalysisDialogTestResult = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: '   ', type: 'non-inclusive' },
          { word: 'leader', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.nonInclusiveWordCounts();

      expect(counts.get('   ')).toBe(1);
    });
  });
});
