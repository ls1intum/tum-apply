import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { StringInputComponent } from './string-input.component';

describe('StringInputComponent', () => {
  let component: StringInputComponent;
  let fixture: ComponentFixture<StringInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StringInputComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(StringInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the provided label', () => {
    fixture.componentRef.setInput('label', 'Full Name');
    fixture.detectChanges();

    const labelElement = fixture.nativeElement.querySelector('label');
    expect(labelElement?.textContent).toContain('Full Name');
  });

  it('should display the required asterisk when required is true', () => {
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const asteriskElement = fixture.nativeElement.querySelector('.required');
    expect(asteriskElement?.textContent).toContain('*');
  });

  it('should disable the input when disabled is true', async () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input');
    expect(input?.disabled).toBe(true);
  });

  it('should apply the placeholder text', () => {
    fixture.componentRef.setInput('placeholder', 'Enter your name');
    fixture.detectChanges();

    const inputElement = fixture.nativeElement.querySelector('input');
    expect(inputElement?.placeholder).toBe('Enter your name');
  });

  it('should emit modelChange when the input value changes', () => {
    const emitSpy = jest.spyOn(component.modelChange, 'emit');
    const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');

    inputElement.value = 'Hello';
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith('Hello');
  });
});
