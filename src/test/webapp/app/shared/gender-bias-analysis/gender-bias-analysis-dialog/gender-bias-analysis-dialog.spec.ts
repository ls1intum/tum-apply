import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { GenderBiasAnalysisResponse } from 'app/generated/model/gender-bias-analysis-response';
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
    result: GenderBiasAnalysisResponse | undefined = undefined,
  ): {
    fixture: ComponentFixture<GenderBiasAnalysisDialogComponent>;
    component: GenderBiasAnalysisDialogComponent;
  } {
    const fixture = TestBed.createComponent(GenderBiasAnalysisDialogComponent);
    const componentRef = fixture.componentRef as ComponentRef<GenderBiasAnalysisDialogComponent>;
    componentRef.setInput('visible', visible);
    if (result !== undefined) {
      componentRef.setInput('result', result);
    }
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

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
    it.each([
      ['non-inclusive-coded', 'genderDecoder.formulationTexts.nonInclusive'],
      ['inclusive-coded', 'genderDecoder.formulationTexts.inclusive'],
      ['neutral', 'genderDecoder.formulationTexts.neutral'],
      ['empty', 'genderDecoder.formulationTexts.neutral'],
      ['unknown-type', 'genderDecoder.formulationTexts.neutral'],
    ])('should map coding %s to %s', (coding, expected) => {
      const { component } = createComponentWithInputs(true, { coding: coding as any, biasedWords: [] });
      expect(component.codingTranslationKey()).toBe(expected);
    });

    it('should return neutral key when result or coding is undefined', () => {
      const { component: noResult } = createComponentWithInputs(true, undefined);
      expect(noResult.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');

      const { component: noCoding } = createComponentWithInputs(true, { coding: undefined, biasedWords: [] });
      expect(noCoding.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
    });
  });

  describe('explanationTranslationKey computed', () => {
    it.each([
      ['non-inclusive-coded', 'genderDecoder.explanations.non-inclusive-coded'],
      ['inclusive-coded', 'genderDecoder.explanations.inclusive-coded'],
      ['neutral', 'genderDecoder.explanations.neutral'],
      ['empty', 'genderDecoder.explanations.empty'],
      ['unknown-type', 'genderDecoder.explanations.neutral'],
    ])('should map coding %s to %s', (coding, expected) => {
      const { component } = createComponentWithInputs(true, { coding: coding as any, biasedWords: [] });
      expect(component.explanationTranslationKey()).toBe(expected);
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

  describe('nonInclusiveWords computed', () => {
    it('should filter and return only non-inclusive words', () => {
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'nonInclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'caring', type: 'inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const result = component.inclusiveWords();

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe('supportive');
      expect(result[1].word).toBe('caring');
    });

    it('should return empty array when no inclusive words exist', () => {
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: undefined,
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.inclusiveWords()).toHaveLength(0);
    });
  });

  describe('nonInclusiveWordCounts computed', () => {
    it('should return word counts for non-inclusive words only', () => {
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
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
      const mockResult: GenderBiasAnalysisResponse = {
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

  describe('edge cases', () => {
    it('should case-sensitively count distinct words and ignore empty strings', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'Leader', type: 'non-inclusive' },
          { word: 'leader', type: 'non-inclusive' },
          { word: 'LEADER', type: 'non-inclusive' },
          { word: 'leader-like', type: 'non-inclusive' },
          { word: "leader's", type: 'non-inclusive' },
          { word: '', type: 'non-inclusive' },
          { word: '   ', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      const counts = component.nonInclusiveWordCounts();

      expect(counts.get('Leader')).toBe(1);
      expect(counts.get('leader')).toBe(1);
      expect(counts.get('LEADER')).toBe(1);
      expect(counts.get('leader-like')).toBe(1);
      expect(counts.get("leader's")).toBe(1);
      expect(counts.get('')).toBeUndefined();
      expect(counts.get('   ')).toBe(1);
    });
  });
});
