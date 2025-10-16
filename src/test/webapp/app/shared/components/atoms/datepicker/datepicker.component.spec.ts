import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { DatePickerComponent } from 'app/shared/components/atoms/datepicker/datepicker.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

describe('DatePickerComponent', () => {
  function createFixture() {
    const fixture = TestBed.createComponent(DatePickerComponent);
    fixture.detectChanges();
    return fixture;
  }

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

  it('should set modelDate to undefined for invalid date', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('selectedDate', 'invalid-date');
    fixture.detectChanges();
    expect(fixture.componentInstance.modelDate()).toBeUndefined();
  });

  it('should update modelDate when selectedDate changes from invalid to valid', () => {
    const fixture = createFixture();

    fixture.componentRef.setInput('selectedDate', 'invalid');
    fixture.detectChanges();
    expect(fixture.componentInstance.modelDate()).toBeUndefined();

    fixture.componentRef.setInput('selectedDate', '2024-10-13');
    fixture.detectChanges();
    const modelDate = fixture.componentInstance.modelDate();
    expect(modelDate).toBeInstanceOf(Date);
    expect(modelDate?.getFullYear()).toBe(2024);
    expect(modelDate?.getMonth()).toBe(9); // October (0-indexed)
    expect(modelDate?.getDate()).toBe(13);
  });

  it('should reset modelDate when selectedDate is undefined', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('selectedDate', '2024-10-13');
    fixture.detectChanges();
    expect(fixture.componentInstance.modelDate()).toBeInstanceOf(Date);
    fixture.componentRef.setInput('selectedDate', undefined);
    fixture.detectChanges();
    expect(fixture.componentInstance.modelDate()).toBeUndefined();
  });

  it('should emit ISO date string when onDateChange called with Date', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const emitSpy = vi.spyOn(comp.selectedDateChange, 'emit');

    comp.onDateChange(new Date(2025, 9, 13)); // Oct 13, 2025
    expect(emitSpy).toHaveBeenCalledWith('2025-10-13');
  });

  it('should emit undefined when onDateChange called with undefined', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const emitSpy = vi.spyOn(comp.selectedDateChange, 'emit');

    comp.onDateChange(undefined);
    expect(emitSpy).toHaveBeenCalledWith(undefined);
  });

  it('should show label and asterisk when required', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('label', 'datepicker.label');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const labelEl = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(labelEl.textContent).toContain('*');
    expect(labelEl.textContent).toContain('datepicker.label');
  });

  it('should toggle isCalendarOpen on show/hide events', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const picker = fixture.debugElement.query(By.css('p-datepicker'));

    picker.triggerEventHandler('onShow', {});
    expect(comp.isCalendarOpen).toBe(true);

    picker.triggerEventHandler('onHide', {});
    expect(comp.isCalendarOpen).toBe(false);
  });

  it('should apply disabled state', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.disabled()).toBe(true);
  });

  it('should render regular icon when icon is not circle-info', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', 'calendar');
    fixture.detectChanges();

    const icons = fixture.debugElement.queryAll(By.css('fa-icon'));
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render translated placeholder when shouldTranslate=true', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('shouldTranslate', true);
    fixture.componentRef.setInput('placeholder', 'datepicker.placeholder');
    fixture.detectChanges();

    expect(fixture.componentInstance.placeholder()).toBe('datepicker.placeholder');
  });
});
