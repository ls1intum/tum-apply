// src/test/webapp/util/translate.mock.ts
import {
  TranslateService,
  LangChangeEvent,
  TranslationChangeEvent,
  DefaultLangChangeEvent,
  InterpolatableTranslationObject,
} from '@ngx-translate/core';
import { EventEmitter, type Provider } from '@angular/core';
import { of } from 'rxjs';

export function createTranslateServiceMock(): Pick<
  TranslateService,
  'instant' | 'get' | 'stream' | 'onTranslationChange' | 'onLangChange' | 'onDefaultLangChange' | 'currentLang' | 'use' | 'setDefaultLang'
> {
  const onTranslationChange = new EventEmitter<TranslationChangeEvent>();
  const onLangChange = new EventEmitter<LangChangeEvent>();
  const onDefaultLangChange = new EventEmitter<DefaultLangChangeEvent>();

  const instant: TranslateService['instant'] = key => (Array.isArray(key) ? key.map(k => String(k)) : String(key));

  const get: TranslateService['get'] = key => of(Array.isArray(key) ? key.map(k => String(k)) : String(key));

  const stream: TranslateService['stream'] = key => of(Array.isArray(key) ? key.map(k => String(k)) : String(key));

  const emptyTranslations: InterpolatableTranslationObject = {};
  const use: TranslateService['use'] = (_lang: string) => of(emptyTranslations);

  const setDefaultLang: TranslateService['setDefaultLang'] = (_lang: string) => undefined;

  return {
    instant,
    get,
    stream,
    onTranslationChange,
    onLangChange,
    onDefaultLangChange,
    currentLang: 'en',
    use,
    setDefaultLang,
  };
}

export function provideTranslateMock(mock: ReturnType<typeof createTranslateServiceMock> = createTranslateServiceMock()): Provider {
  return { provide: TranslateService, useValue: mock };
}
