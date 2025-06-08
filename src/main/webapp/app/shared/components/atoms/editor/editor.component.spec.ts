import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent, FormsModule, ReactiveFormsModule, EditorModule, FontAwesomeModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit modelChange and update the form control on input change', () => {
    const control = new FormControl('');
    fixture.componentRef.setInput('control', control);

    jest.spyOn(component.modelChange, 'emit');
    const event = { htmlValue: '<p>Test</p>' } as any;

    component.onInputChange(event);

    expect(component.modelChange.emit).toHaveBeenCalledWith('<p>Test</p>');
    expect(control.value).toBe('<p>Test</p>');
    expect(control.dirty).toBe(true);
  });

  it('should set isTouched and isFocused on blur', () => {
    component.onBlur();

    expect(component.isTouched()).toBe(true);
    expect(component.isFocused()).toBe(false);
  });

  it('should set isFocused on focus', () => {
    component.onFocus();

    expect(component.isFocused()).toBe(true);
  });

  it('should compute inputState correctly', () => {
    const control = new FormControl('', { validators: [Validators.required] });

    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    // Before touch
    expect(component.inputState()).toBe('untouched');

    // Simulate blur to mark as touched
    component.onBlur();
    control.markAsTouched();
    control.setValue('');
    control.updateValueAndValidity();

    expect(component.inputState()).toBe('invalid');

    // Valid input
    control.setValue('Valid');
    control.updateValueAndValidity();
    expect(component.inputState()).toBe('valid');
  });

  it('should return appropriate error message', () => {
    const control = new FormControl('', Validators.required);
    fixture.componentRef.setInput('control', control);
    control.markAsTouched();
    control.updateValueAndValidity();

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('This field is required');
  });
});
