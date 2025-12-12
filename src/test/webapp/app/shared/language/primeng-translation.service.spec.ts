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

  describe('Initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(PrimengTranslationService);
      expect(service).toBeTruthy();
    });

    it('should apply English locale on initialization when current lang is en', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
      service = TestBed.inject(PrimengTranslationService);

      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          today: 'Today',
          clear: 'Clear',
          weekHeader: 'Wk',
        }),
      );
    });

    it('should apply German locale on initialization when current lang is de', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('de');
      service = TestBed.inject(PrimengTranslationService);

      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          today: 'Heute',
          clear: 'Zurücksetzen',
          weekHeader: 'KW',
        }),
      );
    });

    it('should apply English locale when no language is set', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('');
      service = TestBed.inject(PrimengTranslationService);

      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          today: 'Today',
          clear: 'Clear',
        }),
      );
    });
  });

  describe('English locale configuration', () => {
    beforeEach(() => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
      service = TestBed.inject(PrimengTranslationService);
    });

    it('should set correct English day names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        }),
      );
    });

    it('should set correct English short day names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        }),
      );
    });

    it('should set correct English minimal day names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        }),
      );
    });

    it('should set correct English month names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
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
        }),
      );
    });

    it('should set correct English short month names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        }),
      );
    });
  });

  describe('German locale configuration', () => {
    beforeEach(() => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('de');
      service = TestBed.inject(PrimengTranslationService);
    });

    it('should set correct German day names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        }),
      );
    });

    it('should set correct German short day names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        }),
      );
    });

    it('should set correct German minimal day names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        }),
      );
    });

    it('should set correct German month names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
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
        }),
      );
    });

    it('should set correct German short month names', () => {
      expect(primeNG.setTranslation).toHaveBeenCalledWith(
        expect.objectContaining({
          monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
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
