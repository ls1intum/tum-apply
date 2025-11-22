import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { BiasedWordDTO, GenderBiasAnalysisResponse } from 'app/generated';
import { GenderBiasAnalysisDialogComponent } from 'app/shared/gender-bias-analysis-dialog/gender-bias-analysis-dialog';

describe('GenderBiasAnalysisDialogComponent', () => {
  let component: GenderBiasAnalysisDialogComponent;
  let fixture: ComponentFixture<GenderBiasAnalysisDialogComponent>;
  let translateService: TranslateServiceMock;

  beforeEach(async () => {
    translateService = createTranslateServiceMock();

    await TestBed.configureTestingModule({
      imports: [GenderBiasAnalysisDialogComponent],
      providers: [provideTranslateMock(translateService), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(GenderBiasAnalysisDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onVisibleChange', () => {
    it('should emit visibleChange and closeDialog when visibility is set to false', () => {
      const visibleChangeSpy = vi.fn();
      const closeDialogSpy = vi.fn();

      component.visibleChange.subscribe(visibleChangeSpy);
      component.closeDialog.subscribe(closeDialogSpy);

      component.onVisibleChange(false);

      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
      expect(closeDialogSpy).toHaveBeenCalled();
    });

    it('should not emit when visibility is set to true', () => {
      const visibleChangeSpy = vi.fn();
      const closeDialogSpy = vi.fn();

      component.visibleChange.subscribe(visibleChangeSpy);
      component.closeDialog.subscribe(closeDialogSpy);

      component.onVisibleChange(true);

      expect(visibleChangeSpy).not.toHaveBeenCalled();
      expect(closeDialogSpy).not.toHaveBeenCalled();
    });
  });

  describe('getCodingTranslationKey', () => {
    it('should return correct key for masculine-coded', () => {
      const result = component.getCodingTranslationKey('masculine-coded');
      expect(result).toBe('genderDecoder.formulationTexts.manly');
    });

    it('should return correct key for feminine-coded', () => {
      const result = component.getCodingTranslationKey('feminine-coded');
      expect(result).toBe('genderDecoder.formulationTexts.feminine');
    });

    it('should return correct key for neutral', () => {
      const result = component.getCodingTranslationKey('neutral');
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return correct key for empty', () => {
      const result = component.getCodingTranslationKey('empty');
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });

    it('should return neutral key for unknown coding', () => {
      const result = component.getCodingTranslationKey('unknown-type');
      expect(result).toBe('genderDecoder.formulationTexts.neutral');
    });
  });

  describe('getExplanationTranslationKey', () => {
    it('should return correct key for masculine-coded', () => {
      const result = component.getExplanationTranslationKey('masculine-coded');
      expect(result).toBe('genderDecoder.explanations.masculine-coded');
    });

    it('should return correct key for feminine-coded', () => {
      const result = component.getExplanationTranslationKey('feminine-coded');
      expect(result).toBe('genderDecoder.explanations.feminine-coded');
    });

    it('should return correct key for neutral', () => {
      const result = component.getExplanationTranslationKey('neutral');
      expect(result).toBe('genderDecoder.explanations.neutral');
    });

    it('should return correct key for empty', () => {
      const result = component.getExplanationTranslationKey('empty');
      expect(result).toBe('genderDecoder.explanations.empty');
    });

    it('should return neutral explanation key for unknown coding', () => {
      const result = component.getExplanationTranslationKey('unknown-type');
      expect(result).toBe('genderDecoder.explanations.neutral');
    });
  });

  describe('getBiasTypeClass', () => {
    it('should return masculine-badge for masculine type', () => {
      const result = component.getBiasTypeClass('masculine');
      expect(result).toBe('masculine-badge');
    });

    it('should return feminine-badge for feminine type', () => {
      const result = component.getBiasTypeClass('feminine');
      expect(result).toBe('feminine-badge');
    });

    it('should return feminine-badge for any other type', () => {
      const result = component.getBiasTypeClass('neutral');
      expect(result).toBe('feminine-badge');
    });
  });

  describe('getMasculineWords', () => {
    it('should filter and return only masculine words', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'supportive', type: 'feminine' },
        { word: 'decisive', type: 'masculine' },
      ];

      const result = component.getMasculineWords(words);

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe('leader');
      expect(result[1].word).toBe('decisive');
    });

    it('should return empty array when no masculine words exist', () => {
      const words: BiasedWordDTO[] = [
        { word: 'supportive', type: 'feminine' },
        { word: 'caring', type: 'feminine' },
      ];

      const result = component.getMasculineWords(words);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when input array is empty', () => {
      const result = component.getMasculineWords([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getFeminineWords', () => {
    it('should filter and return only feminine words', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'supportive', type: 'feminine' },
        { word: 'caring', type: 'feminine' },
      ];

      const result = component.getFeminineWords(words);

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe('supportive');
      expect(result[1].word).toBe('caring');
    });

    it('should return empty array when no feminine words exist', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'decisive', type: 'masculine' },
      ];

      const result = component.getFeminineWords(words);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when input array is empty', () => {
      const result = component.getFeminineWords([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getWordCounts', () => {
    it('should count occurrences of each word', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'leader', type: 'masculine' },
        { word: 'decisive', type: 'masculine' },
        { word: 'leader', type: 'masculine' },
      ];

      const result = component.getWordCounts(words);

      expect(result.get('leader')).toBe(3);
      expect(result.get('decisive')).toBe(1);
    });

    it('should return empty map for empty array', () => {
      const result = component.getWordCounts([]);
      expect(result.size).toBe(0);
    });

    it('should handle words with undefined word property', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: undefined, type: 'masculine' },
        { word: 'leader', type: 'masculine' },
      ];

      const result = component.getWordCounts(words);

      expect(result.get('leader')).toBe(2);
      expect(result.get('undefined')).toBeUndefined();
    });

    it('should handle multiple different words', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'decisive', type: 'masculine' },
        { word: 'strong', type: 'masculine' },
      ];

      const result = component.getWordCounts(words);

      expect(result.get('leader')).toBe(1);
      expect(result.get('decisive')).toBe(1);
      expect(result.get('strong')).toBe(1);
      expect(result.size).toBe(3);
    });
  });

  describe('getMasculineWordCounts', () => {
    it('should return word counts for masculine words only', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'supportive', type: 'feminine' },
        { word: 'leader', type: 'masculine' },
        { word: 'decisive', type: 'masculine' },
      ];

      const result = component.getMasculineWordCounts(words);

      expect(result.get('leader')).toBe(2);
      expect(result.get('decisive')).toBe(1);
      expect(result.get('supportive')).toBeUndefined();
    });

    it('should return empty map when no masculine words exist', () => {
      const words: BiasedWordDTO[] = [
        { word: 'supportive', type: 'feminine' },
        { word: 'caring', type: 'feminine' },
      ];

      const result = component.getMasculineWordCounts(words);

      expect(result.size).toBe(0);
    });

    it('should return empty map for empty input', () => {
      const result = component.getMasculineWordCounts([]);
      expect(result.size).toBe(0);
    });
  });

  describe('getFeminineWordCounts', () => {
    it('should return word counts for feminine words only', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'supportive', type: 'feminine' },
        { word: 'supportive', type: 'feminine' },
        { word: 'caring', type: 'feminine' },
      ];

      const result = component.getFeminineWordCounts(words);

      expect(result.get('supportive')).toBe(2);
      expect(result.get('caring')).toBe(1);
      expect(result.get('leader')).toBeUndefined();
    });

    it('should return empty map when no feminine words exist', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader', type: 'masculine' },
        { word: 'decisive', type: 'masculine' },
      ];

      const result = component.getFeminineWordCounts(words);

      expect(result.size).toBe(0);
    });

    it('should return empty map for empty input', () => {
      const result = component.getFeminineWordCounts([]);
      expect(result.size).toBe(0);
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

      const codingKey = component.getCodingTranslationKey(mockResult.coding ?? 'neutral');
      const explanationKey = component.getExplanationTranslationKey(mockResult.coding ?? 'neutral');
      const masculineWords = component.getMasculineWords(mockResult.biasedWords ?? []);
      const masculineCounts = component.getMasculineWordCounts(mockResult.biasedWords ?? []);

      expect(codingKey).toBe('genderDecoder.formulationTexts.manly');
      expect(explanationKey).toBe('genderDecoder.explanations.masculine-coded');
      expect(masculineWords).toHaveLength(3);
      expect(masculineCounts.get('leader')).toBe(2);
      expect(masculineCounts.get('decisive')).toBe(1);
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

      const codingKey = component.getCodingTranslationKey(mockResult.coding ?? 'neutral');
      const explanationKey = component.getExplanationTranslationKey(mockResult.coding ?? 'neutral');
      const feminineWords = component.getFeminineWords(mockResult.biasedWords ?? []);
      const feminineCounts = component.getFeminineWordCounts(mockResult.biasedWords ?? []);

      expect(codingKey).toBe('genderDecoder.formulationTexts.feminine');
      expect(explanationKey).toBe('genderDecoder.explanations.feminine-coded');
      expect(feminineWords).toHaveLength(3);
      expect(feminineCounts.get('supportive')).toBe(2);
      expect(feminineCounts.get('caring')).toBe(1);
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

      const masculineWords = component.getMasculineWords(mockResult.biasedWords ?? []);
      const feminineWords = component.getFeminineWords(mockResult.biasedWords ?? []);

      expect(masculineWords).toHaveLength(2);
      expect(feminineWords).toHaveLength(2);
    });

    it('should handle neutral result with no biased words', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'neutral',
        biasedWords: [],
      };

      const codingKey = component.getCodingTranslationKey(mockResult.coding ?? 'neutral');
      const masculineWords = component.getMasculineWords(mockResult.biasedWords ?? []);
      const feminineWords = component.getFeminineWords(mockResult.biasedWords ?? []);

      expect(codingKey).toBe('genderDecoder.formulationTexts.neutral');
      expect(masculineWords).toHaveLength(0);
      expect(feminineWords).toHaveLength(0);
    });

    it('should handle empty result', () => {
      const mockResult: GenderBiasAnalysisResponse = {
        coding: 'empty',
        biasedWords: undefined,
      };

      const codingKey = component.getCodingTranslationKey(mockResult.coding ?? 'neutral');
      const explanationKey = component.getExplanationTranslationKey(mockResult.coding ?? 'neutral');

      expect(codingKey).toBe('genderDecoder.formulationTexts.neutral');
      expect(explanationKey).toBe('genderDecoder.explanations.empty');
    });
  });

  describe('edge cases', () => {
    it('should handle words with special characters', () => {
      const words: BiasedWordDTO[] = [
        { word: 'leader-like', type: 'masculine' },
        { word: "leader's", type: 'masculine' },
      ];

      const counts = component.getWordCounts(words);

      expect(counts.get('leader-like')).toBe(1);
      expect(counts.get("leader's")).toBe(1);
    });

    it('should handle empty string as word', () => {
      const words: BiasedWordDTO[] = [
        { word: '', type: 'masculine' },
        { word: 'leader', type: 'masculine' },
      ];

      const counts = component.getWordCounts(words);

      // Empty string should not be counted (filtered by if check)
      expect(counts.get('')).toBeUndefined();
      expect(counts.get('leader')).toBe(1);
    });
  });
});
