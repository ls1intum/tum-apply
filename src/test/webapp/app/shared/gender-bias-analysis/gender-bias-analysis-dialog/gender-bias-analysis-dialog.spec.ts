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

  describe('translation key computeds', () => {
    it.each([
      ['non-inclusive-coded', 'genderDecoder.formulationTexts.nonInclusive'],
      ['inclusive-coded', 'genderDecoder.formulationTexts.inclusive'],
      ['neutral', 'genderDecoder.formulationTexts.neutral'],
      ['empty', 'genderDecoder.formulationTexts.neutral'],
      ['unknown-type', 'genderDecoder.formulationTexts.neutral'],
    ])('should map coding %s to coding key %s', (coding, expected) => {
      const { component } = createComponentWithInputs(true, { coding, biasedWords: [] });
      expect(component.codingTranslationKey()).toBe(expected);
    });

    it.each([
      ['non-inclusive-coded', 'genderDecoder.explanations.non-inclusive-coded'],
      ['inclusive-coded', 'genderDecoder.explanations.inclusive-coded'],
      ['neutral', 'genderDecoder.explanations.neutral'],
      ['empty', 'genderDecoder.explanations.empty'],
      ['unknown-type', 'genderDecoder.explanations.neutral'],
    ])('should map coding %s to explanation key %s', (coding, expected) => {
      const { component } = createComponentWithInputs(true, { coding, biasedWords: [] });
      expect(component.explanationTranslationKey()).toBe(expected);
    });

    it('should return neutral keys when result is undefined', () => {
      const { component } = createComponentWithInputs(true, undefined);
      expect(component.codingTranslationKey()).toBe('genderDecoder.formulationTexts.neutral');
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
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'non-inclusive-coded',
        biasedWords: [
          { word: 'leader', type: 'non-inclusive' },
          { word: 'supportive', type: 'inclusive' },
          { word: 'decisive', type: 'non-inclusive' },
        ],
      };
      const { component } = createComponentWithInputs(true, mockResult);

      expect(component.nonInclusiveWords().map(w => w.word)).toEqual(['leader', 'decisive']);
      expect(component.inclusiveWords().map(w => w.word)).toEqual(['supportive']);
    });

    it('should return empty arrays/maps when result or biasedWords is undefined', () => {
      const { component: noResult } = createComponentWithInputs(true, undefined);
      expect(noResult.nonInclusiveWords()).toHaveLength(0);
      expect(noResult.inclusiveWords()).toHaveLength(0);

      const { component: noBiased } = createComponentWithInputs(true, { coding: 'neutral', biasedWords: undefined });
      expect(noBiased.nonInclusiveWords()).toHaveLength(0);
      expect(noBiased.nonInclusiveWordCounts().size).toBe(0);
    });

    it('should count occurrences per word filtered by type', () => {
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

      const counts = component.nonInclusiveWordCounts();
      expect(counts.get('leader')).toBe(2);
      expect(counts.get('decisive')).toBe(1);
      expect(counts.get('supportive')).toBeUndefined();
    });

    it('should case-sensitively count distinct words and ignore empty strings', () => {
      const mockResult: GenderBiasAnalysisResponse = {
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
      expect(counts.get('')).toBeUndefined();
      expect(counts.get('   ')).toBe(1);
    });
  });
});
