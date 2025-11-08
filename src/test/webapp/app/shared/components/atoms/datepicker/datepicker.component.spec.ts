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

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('Date Input and Validation', () => {
    it('should set modelDate to undefined for invalid date', () => {
      const fixture = createFixture();
      setInputAndDetectChanges(fixture, 'selectedDate', 'invalid-date');
      expect(fixture.componentInstance.modelDate()).toBeUndefined();
    });

    it('should update modelDate when selectedDate changes from invalid to valid', () => {
      const fixture = createFixture();

      setInputAndDetectChanges(fixture, 'selectedDate', 'invalid');
      expect(fixture.componentInstance.modelDate()).toBeUndefined();

      setInputAndDetectChanges(fixture, 'selectedDate', TEST_DATES.valid);
      const modelDate = fixture.componentInstance.modelDate();
      expectDateProperties(modelDate, 2024, 9, 13); // October (0-indexed)
    });

    it('should reset modelDate when selectedDate is undefined', () => {
      const fixture = createFixture();
      setInputAndDetectChanges(fixture, 'selectedDate', TEST_DATES.valid);
      expect(fixture.componentInstance.modelDate()).toBeInstanceOf(Date);

      setInputAndDetectChanges(fixture, 'selectedDate', undefined);
      expect(fixture.componentInstance.modelDate()).toBeUndefined();
    });

    it('should handle various invalid date formats', () => {
      const fixture = createFixture();

      TEST_DATES.invalid.forEach(invalidDate => {
        setInputAndDetectChanges(fixture, 'selectedDate', invalidDate);
        expect(fixture.componentInstance.modelDate()).toBeUndefined();
      });
    });
  });

  describe('Date Change Events', () => {
    it('should emit ISO date string when onDateChange called with Date', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const emitSpy = vi.spyOn(comp.selectedDateChange, 'emit');

      comp.onDateChange(TEST_DATES.futureDate);
      expect(emitSpy).toHaveBeenCalledWith('2025-10-13');
    });

    it('should emit undefined when onDateChange called with undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const emitSpy = vi.spyOn(comp.selectedDateChange, 'emit');

      comp.onDateChange(undefined);
      expect(emitSpy).toHaveBeenCalledWith(undefined);
    });

    it('should update modelDate in onDateChange with setTimeout', async () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      comp.onDateChange(TEST_DATES.testDate);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(comp.modelDate()).toEqual(TEST_DATES.testDate);
    });
  });

  describe('Input Properties', () => {
    it('should accept label and required inputs', () => {
      const fixture = createFixture();
      setInputAndDetectChanges(fixture, 'label', 'datepicker.label');
      setInputAndDetectChanges(fixture, 'required', true);

      expect(fixture.componentInstance.label()).toBe('datepicker.label');
      expect(fixture.componentInstance.required()).toBe(true);
    });

    it('should apply disabled state', () => {
      const fixture = createFixture();
      setInputAndDetectChanges(fixture, 'disabled', true);
      expect(fixture.componentInstance.disabled()).toBe(true);
    });

    it('should accept icon input', () => {
      const fixture = createFixture();
      setInputAndDetectChanges(fixture, 'icon', 'calendar');
      expect(fixture.componentInstance.icon()).toBe('calendar');
    });

    it('should accept shouldTranslate and placeholder inputs', () => {
      const fixture = createFixture();
      setInputAndDetectChanges(fixture, 'shouldTranslate', true);
      setInputAndDetectChanges(fixture, 'placeholder', 'datepicker.placeholder');

      expect(fixture.componentInstance.shouldTranslate()).toBe(true);
      expect(fixture.componentInstance.placeholder()).toBe('datepicker.placeholder');
    });
  });

  describe('Calendar State Management', () => {
    it('should toggle isCalendarOpen signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      expect(comp.isCalendarOpen()).toBe(false);

      comp.isCalendarOpen.set(true);
      expect(comp.isCalendarOpen()).toBe(true);

      comp.isCalendarOpen.set(false);
      expect(comp.isCalendarOpen()).toBe(false);
    });
  });

  describe('Date Range Configuration', () => {
    it('should handle effectiveMinDate computation', () => {
      const fixture = createFixture();

      // Test default (today)
      const today = new Date();
      expect(fixture.componentInstance.effectiveMinDate().toDateString()).toBe(today.toDateString());

      // Test with custom minDate
      setInputAndDetectChanges(fixture, 'minDate', TEST_DATES.customMinDate);
      expect(fixture.componentInstance.effectiveMinDate()).toBe(TEST_DATES.customMinDate);
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
        expect(outsideEvent.stopPropagation).toHaveBeenCalled();
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
      const comp = fixture.componentInstance;
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      setupScrollListenerTest(fixture);
      fixture.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    });

    it('should handle edge cases in scroll listener when datepicker panel is null', () => {
      const fixture = createFixture();
      const comp = setupScrollListenerTest(fixture);

      const querySelectorSpy = vi.spyOn(document, 'querySelector').mockReturnValue(null);
      const mockEvent = createMockEvent();

      if (comp['scrollListener']) {
        comp['scrollListener'](mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
      }

      querySelectorSpy.mockRestore();
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
    it('should handle language change events from TranslateService', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const translateService = TestBed.inject(TranslateService);
      const langChangeSpy = vi.spyOn(comp.currentLanguage, 'set');

      translateService.use('de');

      expect(langChangeSpy).toHaveBeenCalledWith('de');
      expect(comp.currentLanguage()).toBe('de');
    });

    it('should handle language changes and date format computation', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      // Test each language format
      Object.entries(LANGUAGE_FORMATS).forEach(([lang, expectedFormat]) => {
        comp.currentLanguage.set(lang);
        expect(comp.currentLanguage()).toBe(lang);
        expect(comp.dateFormat()).toBe(expectedFormat);
      });
    });

    it('should default to English when TranslateService currentLang is falsy', () => {
      const translateService = TestBed.inject(TranslateService);
      vi.spyOn(translateService, 'currentLang', 'get').mockReturnValue(null as unknown as string);

      const fixture = createFixture();
      const comp = fixture.componentInstance;

      expect(comp.currentLanguage()).toBe('en');
    });
  });
});
