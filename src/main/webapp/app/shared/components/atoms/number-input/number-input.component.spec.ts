import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { NumberInputComponent } from './number-input.component';

describe('NumberInputComponent', () => {
  let component: NumberInputComponent;
  let fixture: ComponentFixture<NumberInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should display the label when provided', () => {
    fixture.componentRef.setInput('label', 'GPA');
    fixture.detectChanges();

    const labelEl = fixture.nativeElement.querySelector('label');
    expect(labelEl?.textContent).toContain('GPA');
  });

  it('should show the required asterisk when required is true', () => {
    fixture.componentRef.setInput('label', 'Credits');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const requiredEl = fixture.nativeElement.querySelector('.required');
    expect(requiredEl?.textContent).toContain('*');
  });

  it('should disable the input when disabled is true', async () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input');
    expect(input?.disabled).toBe(true);
  });

  it('should apply the placeholder text', () => {
    fixture.componentRef.setInput('placeholder', 'Enter value');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input');
    expect(input?.placeholder).toBe('Enter value');
  });

  it('should emit modelChange when the model is updated', async () => {
    const spy = jest.spyOn(component.modelChange, 'emit');
    fixture.componentRef.setInput('model', 2.0);
    fixture.detectChanges();
    await fixture.whenStable();

    component.modelChange.emit(3.7);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(3.7);
  });

  it('should allow setting min/max values', () => {
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 5);
    fixture.detectChanges();

    const inputNumber = fixture.debugElement.query(By.css('p-inputnumber')).componentInstance;
    expect(inputNumber.min()).toBe(0);
    expect(inputNumber.max()).toBe(5);
  });

  it('should allow setting min/max fraction digits', () => {
    fixture.componentRef.setInput('minFractionDigits', 1);
    fixture.componentRef.setInput('maxFractionDigits', 2);
    fixture.detectChanges();

    const inputNumber = fixture.debugElement.query(By.css('p-inputnumber')).componentInstance;
    expect(inputNumber.minFractionDigits).toBe(1);
    expect(inputNumber.maxFractionDigits).toBe(2);
  });
});
