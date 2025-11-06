// src/test/webapp/util/translate.mock.ts
import {
  TranslateService,
  LangChangeEvent,
  TranslationChangeEvent,
  FallbackLangChangeEvent,
  InterpolatableTranslationObject,
} from '@ngx-translate/core';
import { type Provider } from '@angular/core';
import { of, Subject } from 'rxjs';

export function createTranslateServiceMock(): Pick<
  TranslateService,
  | 'instant'
  | 'get'
  | 'getParsedResult'
  | 'stream'
  | 'onTranslationChange'
  | 'onLangChange'
  | 'onDefaultLangChange'
  | 'onFallbackLangChange'
  | 'currentLang'
  | 'use'
  | 'setDefaultLang'
  | 'setFallbackLang'
> {
  const onTranslationChangeSubject = new Subject<TranslationChangeEvent>();
  const onLangChangeSubject = new Subject<LangChangeEvent>();
  const onFallbackLangChangeSubject = new Subject<FallbackLangChangeEvent>();

  const instant: TranslateService['instant'] = key => (Array.isArray(key) ? key.map(k => String(k)) : String(key));

  const get: TranslateService['get'] = key => of(Array.isArray(key) ? key.map(k => String(k)) : String(key));

  const getParsedResult: TranslateService['getParsedResult'] = (key, interpolateParams) =>
    Array.isArray(key) ? key.map(k => String(k)) : String(key);

  const stream: TranslateService['stream'] = key => of(Array.isArray(key) ? key.map(k => String(k)) : String(key));

  const emptyTranslations: InterpolatableTranslationObject = {};

  const mock = {
    instant,
    get,
    getParsedResult,
    stream,
    onTranslationChange: onTranslationChangeSubject.asObservable(),
    onLangChange: onLangChangeSubject.asObservable(),
    onDefaultLangChange: onFallbackLangChangeSubject.asObservable(), // Deprecated, aliased to onFallbackLangChange
    onFallbackLangChange: onFallbackLangChangeSubject.asObservable(),
    currentLang: 'en',
    use: (_lang: string) => {
      mock.currentLang = _lang;
      onLangChangeSubject.next({ lang: _lang, translations: emptyTranslations });
      return of(emptyTranslations);
    },
    setDefaultLang: (_lang: string) => {
      onFallbackLangChangeSubject.next({ lang: _lang, translations: emptyTranslations });
      return of(emptyTranslations);
    },
    setFallbackLang: (_lang: string) => {
      onFallbackLangChangeSubject.next({ lang: _lang, translations: emptyTranslations });
      return of(emptyTranslations);
    },
  };

  return mock;
}

export function provideTranslateMock(mock: ReturnType<typeof createTranslateServiceMock> = createTranslateServiceMock()): Provider {
  return { provide: TranslateService, useValue: mock };
}
