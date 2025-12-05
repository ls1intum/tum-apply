import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { GenderBiasAnalysisResponse } from 'app/generated';
import { ComponentRef } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { GenderBiasAnalysisDialogComponent } from 'app/shared/gender-bias-analysis/gender-bias-analysis-dialog/gender-bias-analysis-dialog';

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
    result: GenderBiasAnalysisResponse | null = null,
  ): {
    fixture: ComponentFixture<GenderBiasAnalysisDialogComponent>;
    component: GenderBiasAnalysisDialogComponent;
  } {
    const fixture = TestBed.createComponent(GenderBiasAnalysisDialogComponent);
    const componentRef = fixture.componentRef as ComponentRef<GenderBiasAnalysisDialogComponent>;
    componentRef.setInput('visible', visible);
    if (result !== null) {
      componentRef.setInput('result', result);
    }
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
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
    it('should return correct key for masculine-coded', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.manly');
    });

    it('should return correct key for feminine-coded', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'feminine-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.feminine');
    });

    it('should return correct key for neutral', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return correct key for empty', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'empty',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return neutral key for unknown coding', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'unknown-type' as any,
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return neutral key when result is null', () => {
      const { component } = createComponentWithInputs(true, null);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return neutral key when coding is undefined', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: undefined,
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });
  });

  describe('explanationTranslationKey computed', () => {
    it('should return correct key for masculine-coded', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.masculine-coded');
    });

    it('should return correct key for feminine-coded', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'feminine-coded',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.feminine-coded');
    });

    it('should return correct key for neutral', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.neutral');
    });

    it('should return correct key for empty', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'empty',
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.empty');
    });

    it('should return neutral explanation key for unknown coding', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'unknown-type' as any,
        biasedWords: [],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.neutral');
    });

    it('should return neutral key when result is null', () => {
      const { component } = createComponentWithInputs(true, null);

      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.neutral');
    });
  });

  describe('getBiasTypeClass', () => {
    it('should return masculine-badge for masculine type', () => {
      const { component } = createComponentWithInputs(true);
      const result = component.getBiasTypeClass('masculine');
      expect(result).toBe('masculine-badge');
    });

    it('should return feminine-badge for feminine type', () => {
      const { component } = createComponentWithInputs(true);
      const result = component.getBiasTypeClass('feminine');
      expect(result).toBe('feminine-badge');
    });

    it('should return feminine-badge for any other type', () => {
      const { component } = createComponentWithInputs(true);
      const result = component.getBiasTypeClass('neutral');
      expect(result).toBe('feminine-badge');
    });

    it('should return feminine-badge for empty string', () => {
      const { component } = createComponentWithInputs(true);
      const result = component.getBiasTypeClass('');
      expect(result).toBe('feminine-badge');
    });
  });

  describe('masculineWords computed', () => {
    it('should filter and return only masculine words', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'supportive', type: 'feminine' },
          { word: 'decisive', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.masculineWords();

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe('leader');
      expect(result[1].word).toBe('decisive');
    });

    it('should return empty array when no masculine words exist', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'feminine-coded',
        biasedWords: [
          { word: 'supportive', type: 'feminine' },
          { word: 'caring', type: 'feminine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.masculineWords()).toHaveLength(0);
    });

    it('should return empty array when biasedWords is undefined', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: undefined,
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.masculineWords()).toHaveLength(0);
    });

    it('should return empty array when result is null', () => {
      const { component } = createComponentWithInputs(true, null);

      expect(component.masculineWords()).toHaveLength(0);
    });
  });

  describe('feminineWords computed', () => {
    it('should filter and return only feminine words', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'feminine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'supportive', type: 'feminine' },
          { word: 'caring', type: 'feminine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.feminineWords();

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe('supportive');
      expect(result[1].word).toBe('caring');
    });

    it('should return empty array when no feminine words exist', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'decisive', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.feminineWords()).toHaveLength(0);
    });

    it('should return empty array when biasedWords is undefined', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: undefined,
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.feminineWords()).toHaveLength(0);
    });
  });

  describe('masculineWordCounts computed', () => {
    it('should return word counts for masculine words only', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'supportive', type: 'feminine' },
          { word: 'leader', type: 'masculine' },
          { word: 'decisive', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.masculineWordCounts();

      expect(result.get('leader')).toBe(2);
      expect(result.get('decisive')).toBe(1);
      expect(result.get('supportive')).toBeUndefined();
    });

    it('should return empty map when no masculine words exist', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'feminine-coded',
        biasedWords: [
          { word: 'supportive', type: 'feminine' },
          { word: 'caring', type: 'feminine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.masculineWordCounts().size).toBe(0);
    });

    it('should handle words with undefined word property', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: undefined, type: 'masculine' },
          { word: 'leader', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.masculineWordCounts();

      expect(result.get('leader')).toBe(2);
      expect(result.get('undefined')).toBeUndefined();
    });
  });

  describe('feminineWordCounts computed', () => {
    it('should return word counts for feminine words only', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'feminine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'supportive', type: 'feminine' },
          { word: 'supportive', type: 'feminine' },
          { word: 'caring', type: 'feminine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.feminineWordCounts();

      expect(result.get('supportive')).toBe(2);
      expect(result.get('caring')).toBe(1);
      expect(result.get('leader')).toBeUndefined();
    });

    it('should return empty map when no feminine words exist', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'decisive', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.feminineWordCounts().size).toBe(0);
    });
  });

  describe('component inputs and outputs', () => {
    it('should accept visible input', () => {
      const { component } = createComponentWithInputs(true);
      expect(component.visible()).toBe(true);
    });

    it('should accept result input', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [{ word: 'leader', type: 'masculine' }],
      };

      const { component } = createComponentWithInputs(true, mockResult);
      expect(component.result()).toEqual(mockResult);
    });

    it('should handle null result input', () => {
      const { component } = createComponentWithInputs(true, null);
      expect(component.result()).toBeNull();
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
    it('should handle complete masculine-coded analysis result', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'decisive', type: 'masculine' },
          { word: 'leader', type: 'masculine' },
        ],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.manly');
      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.masculine-coded');
      expect(component.masculineWords()).toHaveLength(3);
      expect(component.masculineWordCounts().get('leader')).toBe(2);
      expect(component.masculineWordCounts().get('decisive')).toBe(1);
    });

    it('should handle complete feminine-coded analysis result', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'feminine-coded',
        biasedWords: [
          { word: 'supportive', type: 'feminine' },
          { word: 'caring', type: 'feminine' },
          { word: 'supportive', type: 'feminine' },
        ],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.feminine');
      expect(component.explanationTranslationKey()).toBe('genderDecoder.explanations.feminine-coded');
      expect(component.feminineWords()).toHaveLength(3);
      expect(component.feminineWordCounts().get('supportive')).toBe(2);
      expect(component.feminineWordCounts().get('caring')).toBe(1);
    });

    it('should handle mixed biased words result', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader', type: 'masculine' },
          { word: 'supportive', type: 'feminine' },
          { word: 'decisive', type: 'masculine' },
          { word: 'caring', type: 'feminine' },
        ],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.masculineWords()).toHaveLength(2);
      expect(component.feminineWords()).toHaveLength(2);
    });

    it('should handle neutral result with no biased words', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: [],
      };

      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
      expect(component.masculineWords()).toHaveLength(0);
      expect(component.feminineWords()).toHaveLength(0);
    });

    it('should handle empty result', () => {
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'leader-like', type: 'masculine' },
          { word: "leader's", type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.masculineWordCounts();

      expect(counts.get('leader-like')).toBe(1);
      expect(counts.get("leader's")).toBe(1);
    });

    it('should handle case-sensitive word counting', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: 'Leader', type: 'masculine' },
          { word: 'leader', type: 'masculine' },
          { word: 'LEADER', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.masculineWordCounts();

      expect(counts.get('Leader')).toBe(1);
      expect(counts.get('leader')).toBe(1);
      expect(counts.get('LEADER')).toBe(1);
    });

    it('should handle empty string as word', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: '', type: 'masculine' },
          { word: 'leader', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.masculineWordCounts();

      expect(counts.get('')).toBeUndefined();
      expect(counts.get('leader')).toBe(1);
    });

    it('should handle whitespace-only words', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'masculine-coded',
        biasedWords: [
          { word: '   ', type: 'masculine' },
          { word: 'leader', type: 'masculine' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.masculineWordCounts();

      expect(counts.get('   ')).toBe(1);
      expect(counts.get('leader')).toBe(1);
    });
  });
});
