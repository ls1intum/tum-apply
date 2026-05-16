import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MissingTranslationHandlerParams, TranslateService } from '@ngx-translate/core';
import { MissingTranslationHandlerImpl, missingTranslationHandler } from 'app/config/translation.config';

describe('Translation Config', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('MissingTranslationHandlerImpl', () => {
    let handler: MissingTranslationHandlerImpl;

    beforeEach(() => {
      handler = new MissingTranslationHandlerImpl();
    });

    it('should handle missing translation with key', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'test.key',
        translateService: {} as TranslateService,
      };

      expect(handler.handle(params)).toBe('translation-not-found[test.key]');
    });

    it('should ignore interpolation params', () => {
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

  it('missingTranslationHandler should create new instance on each call', () => {
    const handler1 = missingTranslationHandler();
    const handler2 = missingTranslationHandler();

    expect(handler1).not.toBe(handler2);
    expect(handler1).toBeInstanceOf(MissingTranslationHandlerImpl);
  });
});
