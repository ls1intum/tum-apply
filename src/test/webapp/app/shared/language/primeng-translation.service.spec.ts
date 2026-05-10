import { TestBed } from '@angular/core/testing';
import { PrimengTranslationService } from 'app/shared/language/primeng-translation.service';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { vi } from 'vitest';
import { Subject } from 'rxjs';

describe('PrimengTranslationService', () => {
  let service: PrimengTranslationService;
  let translate: TranslateService;
  let primeNG: PrimeNG;
  let mockTranslate: ReturnType<typeof createTranslateServiceMock>;
  let langChangeSubject: Subject<{ lang: string }>;

  beforeEach(() => {
    langChangeSubject = new Subject<{ lang: string }>();
    mockTranslate = createTranslateServiceMock();
    mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');

    Object.defineProperty(mockTranslate, 'onLangChange', {
      get: () => langChangeSubject.asObservable(),
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [provideTranslateMock(mockTranslate), PrimengTranslationService, PrimeNG],
    });

    translate = TestBed.inject(TranslateService);
    primeNG = TestBed.inject(PrimeNG);

    vi.spyOn(primeNG, 'setTranslation');
  });

  afterEach(() => {
    langChangeSubject.complete();
    vi.clearAllMocks();
  });

  describe('locale application on initialization', () => {
    it.each([
      ['en', { today: 'Today', clear: 'Clear', weekHeader: 'Wk' }],
      ['de', { today: 'Heute', clear: 'Zurücksetzen', weekHeader: 'KW' }],
      ['', { today: 'Today', clear: 'Clear' }],
    ])('should apply correct locale strings when current lang is "%s"', (lang, expected) => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue(lang);
      service = TestBed.inject(PrimengTranslationService);

      expect(primeNG.setTranslation).toHaveBeenCalledWith(expect.objectContaining(expected));
    });

    it('should apply full English locale strings (day/month/empty messages)', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
      service = TestBed.inject(PrimengTranslationService);

      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
          monthNames: [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ],
          monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          emptyFilterMessage: 'No results found',
          emptyMessage: 'No available options',
        }),
      );
    });

    it('should apply full German locale strings (day/month/empty messages)', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('de');
      service = TestBed.inject(PrimengTranslationService);

      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
          dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
          dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
          monthNames: [
            'Januar',
            'Februar',
            'März',
            'April',
            'Mai',
            'Juni',
            'Juli',
            'August',
            'September',
            'Oktober',
            'November',
            'Dezember',
          ],
          monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
          emptyFilterMessage: 'Keine Ergebnisse gefunden',
          emptyMessage: 'Keine Optionen verfügbar',
        }),
      );
    });
  });

  describe('Language switching', () => {
    beforeEach(() => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
      service = TestBed.inject(PrimengTranslationService);
    });

    it('should switch to German when language changes from en to de', () => {
      langChangeSubject.next({ lang: 'de' });

      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          today: 'Heute',
          clear: 'Zurücksetzen',
          weekHeader: 'KW',
          dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        }),
      );
    });

    it('should switch to English when language changes from de to en', () => {
      langChangeSubject.next({ lang: 'de' });
      langChangeSubject.next({ lang: 'en' });

      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          today: 'Today',
          clear: 'Clear',
          weekHeader: 'Wk',
          dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        }),
      );
    });

    it('should handle case-insensitive German locale (DE, de, dE)', () => {
      langChangeSubject.next({ lang: 'DE' });
      expect(primeNG.setTranslation).toHaveBeenCalledWith(expect.objectContaining({ today: 'Heute' }));

      langChangeSubject.next({ lang: 'dE' });
      expect(primeNG.setTranslation).toHaveBeenCalledWith(expect.objectContaining({ today: 'Heute' }));
    });

    it('should default to English for unknown languages', () => {
      langChangeSubject.next({ lang: 'fr' });
      expect(primeNG.setTranslation).toHaveBeenCalledWith(expect.objectContaining({ today: 'Today' }));

      langChangeSubject.next({ lang: 'es' });
      expect(primeNG.setTranslation).toHaveBeenCalledWith(expect.objectContaining({ today: 'Today' }));

      langChangeSubject.next({ lang: 'zh' });
      expect(primeNG.setTranslation).toHaveBeenCalledWith(expect.objectContaining({ today: 'Today' }));
    });
  });
});
