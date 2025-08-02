import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent, FormsModule, ReactiveFormsModule, FontAwesomeModule, TranslateModule.forRoot()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    jest.spyOn(translate, 'instant').mockImplementation((key: string | string[]) => key);

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('should return warning color when character count exceeds limit slightly', () => {
    fixture.componentRef.setInput('characterLimit', 10);
    fixture.detectChanges();

    component['htmlValue'].set('<p>This is long</p>'); // >10 chars
    fixture.detectChanges();

    expect(component.charCounterColor()).toBe('char-counter-warning');
  });

  it('should update form control on content change', () => {
    const control = new FormControl('');
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();

    const mockEditor = {
      root: { innerHTML: '<p>Hello world</p>' },
      getSelection: jest.fn().mockReturnValue(null),
      setContents: jest.fn(),
      setSelection: jest.fn(),
    };

    const mockEvent = {
      source: 'user',
      oldDelta: { ops: [] },
      editor: mockEditor,
    };

    component.textChanged(mockEvent as any);
    expect(control.value).toBe('<p>Hello world</p>');
  });

  it('should mark input as empty when no text and blurred', () => {
    component['htmlValue'].set('');
    component.onBlur(); // triggers isTouched
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(true);
  });
});
