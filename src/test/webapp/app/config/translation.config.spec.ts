import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { MissingTranslationHandlerParams, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MissingTranslationHandlerImpl, missingTranslationHandler, translationNotFoundMessage } from 'app/config/translation.config';

describe('Translation Config', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('translationNotFoundMessage', () => {
    it('should have correct constant value', () => {
      expect(translationNotFoundMessage).toBe('translation-not-found');
    });
  });

  describe('MissingTranslationHandlerImpl', () => {
    let handler: MissingTranslationHandlerImpl;

    beforeEach(() => {
      handler = new MissingTranslationHandlerImpl();
    });

    it('should create instance', () => {
      expect(handler).toBeTruthy();
      expect(handler).toBeInstanceOf(MissingTranslationHandlerImpl);
    });

    it('should handle missing translation with key', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'test.key',
        translateService: {} as TranslateService,
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[test.key]');
    });

    it('should handle missing translation and ignore interpolation params', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'user.greeting',
        translateService: {} as TranslateService,
        interpolateParams: { username: 'Alice' },
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[user.greeting]');
      expect(result).not.toContain('Alice');
    });
  });

  describe('missingTranslationHandler', () => {
    it('should return MissingTranslationHandlerImpl instance', () => {
      const handler = missingTranslationHandler();
      expect(handler).toBeTruthy();
      expect(handler).toBeInstanceOf(MissingTranslationHandlerImpl);
    });

    it('should create new instance on each call', () => {
      const handler1 = missingTranslationHandler();
      const handler2 = missingTranslationHandler();

      expect(handler1).not.toBe(handler2);
      expect(handler1).toBeInstanceOf(MissingTranslationHandlerImpl);
      expect(handler2).toBeInstanceOf(MissingTranslationHandlerImpl);
    });

    it('should return handler with correct behavior', () => {
      const handler = missingTranslationHandler();

      const testCases = [
        { key: 'test1', expected: 'translation-not-found[test1]' },
        { key: 'test.nested.key', expected: 'translation-not-found[test.nested.key]' },
        { key: '', expected: 'translation-not-found[]' },
      ];

      testCases.forEach(testCase => {
        const result = handler.handle({
          key: testCase.key,
          translateService: {} as TranslateService,
        });
        expect(result).toBe(testCase.expected);
      });
    });
  });
});
