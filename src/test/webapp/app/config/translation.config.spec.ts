import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { MissingTranslationHandlerParams } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  MissingTranslationHandlerImpl,
  translatePartialLoader,
  missingTranslationHandler,
  translationNotFoundMessage,
} from 'app/config/translation.config';

describe('Translation Config', () => {
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
        translateService: {} as any,
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[test.key]');
    });

    it('should handle missing translation with nested key', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'global.menu.entities.user',
        translateService: {} as any,
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[global.menu.entities.user]');
    });

    it('should handle missing translation with simple key', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'home',
        translateService: {} as any,
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[home]');
    });

    it('should handle missing translation with empty key', () => {
      const params: MissingTranslationHandlerParams = {
        key: '',
        translateService: {} as any,
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[]');
    });

    it('should handle missing translation with key containing special characters', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'test.key-with_special.chars123',
        translateService: {} as any,
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[test.key-with_special.chars123]');
    });

    it('should handle missing translation with interpolation params', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'test.key',
        translateService: {} as any,
        interpolateParams: { name: 'John', count: 5 },
      };

      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[test.key]');
    });

    it('should handle missing translation and ignore interpolation params', () => {
      const params: MissingTranslationHandlerParams = {
        key: 'user.greeting',
        translateService: {} as any,
        interpolateParams: { username: 'Alice' },
      };

      const result = handler.handle(params);
      // Handler should only return the key, not try to interpolate
      expect(result).toBe('translation-not-found[user.greeting]');
      expect(result).not.toContain('Alice');
    });
  });

  describe('translatePartialLoader', () => {
    let mockHttpClient: HttpClient;

    beforeEach(() => {
      mockHttpClient = {
        get: vi.fn(() => of({})),
      } as any;
    });

    it('should create TranslateHttpLoader instance', () => {
      const loader = translatePartialLoader(mockHttpClient);
      expect(loader).toBeTruthy();
    });

    it('should configure loader with correct prefix', () => {
      const loader = translatePartialLoader(mockHttpClient);
      // TranslateHttpLoader should use /i18n/ as prefix
      expect(loader).toHaveProperty('prefix');
      expect((loader as any).prefix).toBe('/i18n/');
    });

    it('should configure loader with correct suffix including hash', () => {
      const loader = translatePartialLoader(mockHttpClient);
      // TranslateHttpLoader should use .json?_=<hash> as suffix
      expect(loader).toHaveProperty('suffix');
      expect((loader as any).suffix).toMatch(/^\.json\?_=/);
    });

    it('should use provided HttpClient', () => {
      const loader = translatePartialLoader(mockHttpClient);
      expect((loader as any).http).toBe(mockHttpClient);
    });

    it('should create different loader instances for different HttpClient instances', () => {
      const mockHttpClient2 = { get: vi.fn(() => of({})) } as any;
      
      const loader1 = translatePartialLoader(mockHttpClient);
      const loader2 = translatePartialLoader(mockHttpClient2);
      
      expect(loader1).not.toBe(loader2);
      expect((loader1 as any).http).toBe(mockHttpClient);
      expect((loader2 as any).http).toBe(mockHttpClient2);
    });

    it('should load translation files with getTranslation method', () => {
      const mockTranslations = { 'test.key': 'Test Value' };
      const getMock = vi.fn(() => of(mockTranslations));
      mockHttpClient = { get: getMock } as any;
      
      const loader = translatePartialLoader(mockHttpClient);
      
      loader.getTranslation('en').subscribe(translations => {
        expect(translations).toEqual(mockTranslations);
      });
      
      expect(getMock).toHaveBeenCalled();
    });

    it('should construct correct URL for language', () => {
      const loader = translatePartialLoader(mockHttpClient);
      
      loader.getTranslation('de').subscribe();
      
      expect(mockHttpClient.get).toHaveBeenCalled();
      const callArgs = (mockHttpClient.get as any).mock.calls[0];
      expect(callArgs[0]).toMatch(/^\/i18n\/de\.json\?_=/);
    });

    it('should construct correct URL for different languages', () => {
      const loader = translatePartialLoader(mockHttpClient);
      
      loader.getTranslation('en').subscribe();
      loader.getTranslation('de').subscribe();
      loader.getTranslation('fr').subscribe();
      
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
      const calls = (mockHttpClient.get as any).mock.calls;
      expect(calls[0][0]).toMatch(/^\/i18n\/en\.json\?_=/);
      expect(calls[1][0]).toMatch(/^\/i18n\/de\.json\?_=/);
      expect(calls[2][0]).toMatch(/^\/i18n\/fr\.json\?_=/);
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

    it('should return handler that can handle missing translations', () => {
      const handler = missingTranslationHandler();
      const params: MissingTranslationHandlerParams = {
        key: 'some.missing.key',
        translateService: {} as any,
      };
      
      const result = handler.handle(params);
      expect(result).toBe('translation-not-found[some.missing.key]');
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
          translateService: {} as any,
        });
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('Integration tests', () => {
    it('should work together: loader and missing handler', () => {
      const mockHttpClient = { get: vi.fn(() => of({})) } as any;
      const loader = translatePartialLoader(mockHttpClient);
      const handler = missingTranslationHandler();
      
      expect(loader).toBeTruthy();
      expect(handler).toBeTruthy();
      
      // Handler should work independently of loader
      const result = handler.handle({
        key: 'missing.key',
        translateService: {} as any,
      });
      expect(result).toBe('translation-not-found[missing.key]');
    });

    it('should maintain consistent translation not found format', () => {
      const handler1 = new MissingTranslationHandlerImpl();
      const handler2 = missingTranslationHandler();
      
      const params: MissingTranslationHandlerParams = {
        key: 'test.key',
        translateService: {} as any,
      };
      
      const result1 = handler1.handle(params);
      const result2 = handler2.handle(params);
      
      expect(result1).toBe(result2);
      expect(result1).toBe('translation-not-found[test.key]');
    });
  });
});
