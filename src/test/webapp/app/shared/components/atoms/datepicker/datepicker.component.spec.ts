import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { DatePickerComponent } from 'app/shared/components/atoms/datepicker/datepicker.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { TranslateService } from '@ngx-translate/core';

describe('DatePickerComponent', () => {
  // Test data constants
  const TEST_DATES = {
    valid: '2024-10-13',
    validDate: new Date(2024, 9, 13), // October 13, 2024
    futureDate: new Date(2025, 9, 13), // October 13, 2025
    customMinDate: new Date(2025, 5, 15), // June 15, 2025
    testDate: new Date(2024, 5, 15), // June 15, 2024
    invalid: [
      '1800-10-13', // Invalid year
      '2024-13-13', // Invalid month
      '2024-10-32', // Invalid day
      '2024-abc-13', // Non-numeric parts
      '2024-10', // Wrong format
      'invalid-date-format', // Completely malformed
    ],
  };

  const LANGUAGE_FORMATS = {
    en: 'dd/mm/yy',
    de: 'dd.mm.yy',
    fr: 'dd.mm.yy', // defaults to German format
  };

  // Helper functions
  const createFixture = () => {
    const fixture = TestBed.createComponent(DatePickerComponent);
    fixture.detectChanges();
    return fixture;
  };

  const setInputAndDetectChanges = (fixture: ComponentFixture<DatePickerComponent>, inputName: string, value: unknown) => {
    fixture.componentRef.setInput(inputName, value);
    fixture.detectChanges();
  };

  const createMockEvent = (target: EventTarget = document.body): Event => {
    return {
      target,
      stopPropagation: vi.fn(),
    } as unknown as Event;
  };

  const setupScrollListenerTest = (fixture: ComponentFixture<DatePickerComponent>) => {
    const comp = fixture.componentInstance;
    comp.isCalendarOpen.set(true);
    fixture.detectChanges();
    return comp;
  };

  const expectDateProperties = (date: Date | undefined, year: number, month: number, day: number) => {
    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(year);
    expect(date?.getMonth()).toBe(month);
    expect(date?.getDate()).toBe(day);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Date Input and Validation', () => {
    it('should update modelDate when selectedDate changes from invalid to valid and back to undefined', () => {
      const fixture = createFixture();

      setInputAndDetectChanges(fixture, 'selectedDate', 'invalid');
      expect(fixture.componentInstance.modelDate()).toBeUndefined();

      setInputAndDetectChanges(fixture, 'selectedDate', TEST_DATES.valid);
      expectDateProperties(fixture.componentInstance.modelDate(), 2024, 9, 13);

      setInputAndDetectChanges(fixture, 'selectedDate', undefined);
      expect(fixture.componentInstance.modelDate()).toBeUndefined();
    });

    it('should treat various invalid date formats as undefined', () => {
      const fixture = createFixture();

      TEST_DATES.invalid.forEach(invalidDate => {
        setInputAndDetectChanges(fixture, 'selectedDate', invalidDate);
        expect(fixture.componentInstance.modelDate()).toBeUndefined();
      });
    });
  });

  describe('Date Change Events', () => {
    it.each<[Date | undefined, string | undefined]>([
      [TEST_DATES.futureDate, '2025-10-13'],
      [undefined, undefined],
    ])('should emit %s as %s on onDateChange', (input, expected) => {
      const fixture = createFixture();
      const emitSpy = vi.spyOn(fixture.componentInstance.selectedDateChange, 'emit');

      fixture.componentInstance.onDateChange(input);
      expect(emitSpy).toHaveBeenCalledWith(expected);
    });

    it('should update modelDate in onDateChange with setTimeout', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      comp.onDateChange(TEST_DATES.testDate);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(comp.modelDate()).toEqual(TEST_DATES.testDate);
    });
  });

  describe('Date Range Configuration', () => {
    it('should default effectiveMinDate to today and override when minDate is set', () => {
      const fixture = createFixture();
      expect(fixture.componentInstance.effectiveMinDate().toDateString()).toBe(new Date().toDateString());

      setInputAndDetectChanges(fixture, 'minDate', TEST_DATES.customMinDate);
      expect(fixture.componentInstance.effectiveMinDate()).toStrictEqual(TEST_DATES.customMinDate);
    });

    it('should identify the highlighted reference date', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      setInputAndDetectChanges(fixture, 'highlightedDate', TEST_DATES.validDate);

      expect(comp.isHighlightedDate({ day: 13, month: 9, year: 2024 })).toBe(true);
      expect(comp.isHighlightedDate({ day: 14, month: 9, year: 2024 })).toBe(false);
    });
  });

  describe('Scroll Event Management', () => {
    it('should manage scroll event listeners when calendar opens and closes', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      expect(comp.isCalendarOpen()).toBe(false);

      // Open calendar - should add scroll listener
      comp.isCalendarOpen.set(true);
      fixture.detectChanges();
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);

      // Close calendar - should remove scroll listener
      comp.isCalendarOpen.set(false);
      fixture.detectChanges();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    });

    it('should handle scroll events correctly based on target location', () => {
      const fixture = createFixture();
      const comp = setupScrollListenerTest(fixture);

      // Test scroll outside datepicker - should call stopPropagation
      const outsideEvent = createMockEvent();
      if (comp['scrollListener']) {
        comp['scrollListener'](outsideEvent);
        expect(outsideEvent.stopPropagation).toHaveBeenCalledOnce();
      }

      // Test scroll within datepicker panel - should NOT call stopPropagation
      const mockPanel = document.createElement('div');
      const mockTarget = document.createElement('div');
      mockPanel.appendChild(mockTarget);

      const querySelectorSpy = vi.spyOn(document, 'querySelector').mockReturnValue(mockPanel);
      vi.spyOn(mockPanel, 'contains').mockReturnValue(true);

      const insideEvent = createMockEvent(mockTarget);
      if (comp['scrollListener']) {
        comp['scrollListener'](insideEvent);
        expect(insideEvent.stopPropagation).not.toHaveBeenCalled();
      }

      querySelectorSpy.mockRestore();
    });

    it('should clean up scroll listener on component destruction', () => {
      const fixture = createFixture();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      setupScrollListenerTest(fixture);
      fixture.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    });
  });

  describe('Error Handling', () => {
    it('should handle exceptions in date parsing and trigger catch block', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      // Mock Date constructor to throw an error to trigger the catch block
      const originalDate = global.Date;
      const mockDate = vi.fn().mockImplementation(() => {
        throw new Error('Date parsing error');
      });
      global.Date = mockDate as unknown as DateConstructor;

      try {
        setInputAndDetectChanges(fixture, 'selectedDate', '2024-10-15');
        expect(comp.modelDate()).toBeUndefined();
      } finally {
        global.Date = originalDate;
      }
    });
  });

  describe('Language and Localization', () => {
    it('should handle language changes and date format computation for each language', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      Object.entries(LANGUAGE_FORMATS).forEach(([lang, expectedFormat]) => {
        comp.currentLanguage.set(lang);
        expect(comp.dateFormat()).toBe(expectedFormat);
      });
    });

    it('should sync with TranslateService.use() and default to English when currentLang is falsy', () => {
      const fixture = createFixture();
      const translateService = TestBed.inject(TranslateService);
      translateService.use('de');
      expect(fixture.componentInstance.currentLanguage()).toBe('de');

      vi.spyOn(translateService, 'currentLang', 'get').mockReturnValue(null as unknown as string);
      const newFixture = createFixture();
      expect(newFixture.componentInstance.currentLanguage()).toBe('en');
    });
  });
});
