import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

import { DatePickerComponent } from './datepicker.component';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;
  let library: FaIconLibrary;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;

    library = TestBed.inject(FaIconLibrary);
    library.addIcons(faCalendar);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a custom label', () => {
    fixture.componentRef.setInput('label', 'Start Date');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Start Date');
  });

  it('should show required asterisk when required is true', () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const required = fixture.nativeElement.querySelector('.required');
    expect(required).toBeTruthy();
    expect(required.textContent).toBe('*');
  });

  it('should emit selectedDateChange with ISO string when a valid date is chosen', () => {
    const spy = jest.spyOn(component.selectedDateChange, 'emit');
    component.onDateChange(new Date(2025, 0, 1));
    expect(spy).toHaveBeenCalledWith('2025-01-01');
  });

  it('should not crash on invalid input date string', () => {
    fixture.componentRef.setInput('selectedDate', 'not-a-date');
    fixture.detectChanges();
    expect(component.modelDate()).toBeUndefined();
  });
});
