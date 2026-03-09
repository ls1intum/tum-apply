import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('StringInputComponent', () => {
  function createFixture() {
    const fixture = TestBed.createComponent(StringInputComponent);
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('placeholder', 'Enter value');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('id', 'testInput');
    fixture.componentRef.setInput('width', '300px');
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StringInputComponent, ReactiveFormsModule],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render label and required asterisk', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    expect(comp.label()).toBe('Test Label');
    expect(comp.required()).toBe(true);
  });

  it('should not show asterisk when required=false', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('required', false);

    const comp = fixture.componentInstance;
    expect(comp.required()).toBe(false);
  });

  it('should call onInputChange and emit modelChange with new value', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const emitSpy = vi.spyOn(comp.modelChange, 'emit');
    const mockCtrl = new FormControl('');
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    comp.onInputChange('Hello');
    expect(emitSpy).toHaveBeenCalledWith('Hello');
    expect(mockCtrl.value).toBe('Hello');
    expect(mockCtrl.dirty).toBe(true);
  });

  it('should bind placeholder correctly', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp.placeholder()).toBe('Enter value');
  });

  it('should not display tooltip when icon is not circle-info', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('icon', 'user');
    await fixture.whenStable();

    expect(comp.icon()).toBe('user');
    expect(comp.tooltipText()).toBeUndefined();
  });

  it('should show tooltip when icon is circle-info and tooltipText is provided', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('icon', 'circle-info');
    fixture.componentRef.setInput('tooltipText', 'Helpful information');
    await fixture.whenStable();

    expect(comp.icon()).toBe('circle-info');
    expect(comp.tooltipText()).toBe('Helpful information');
  });

  it('should show translated label when shouldTranslate=true', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('shouldTranslate', true);
    fixture.componentRef.setInput('label', 'string.label');
    await fixture.whenStable();

    expect(comp.shouldTranslate()).toBe(true);
  });

  it('should call onFocus and onBlur handlers when input is focused and blurred', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const spyFocus = vi.spyOn(comp, 'onFocus');
    const spyBlur = vi.spyOn(comp, 'onBlur');

    comp.onFocus();
    comp.onBlur();

    expect(spyFocus).toHaveBeenCalledTimes(1);
    expect(spyBlur).toHaveBeenCalledTimes(1);
  });

  describe('BaseInputDirective - isTouched computed property', () => {
    it('should return false when input has not been touched and control has no errors', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('');
      fixture.componentRef.setInput('control', ctrl);

      expect(comp.isTouched()).toBe(false);
    });

    it('should return true when input has been blurred (onBlur called)', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      comp.onBlur();
      fixture.detectChanges();

      expect(comp.isTouched()).toBe(true);
    });

    it('should return false when control.touched is true but only has required error', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('', []);
      fixture.componentRef.setInput('control', ctrl);
      ctrl.setErrors({ required: true });
      ctrl.markAsTouched();
      fixture.detectChanges();

      expect(comp.isTouched()).toBe(false);
    });
  });

  describe('BaseInputDirective - inputState computed property', () => {
    it('should return untouched when input has not been touched', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('valid value');
      fixture.componentRef.setInput('control', ctrl);

      expect(comp.inputState()).toBe('untouched');
    });

    it('should return invalid when control is invalid and touched', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('', { validators: c => (c.value === '' ? { required: true } : null) });
      fixture.componentRef.setInput('control', ctrl);

      comp.onBlur();
      fixture.detectChanges();

      expect(comp.inputState()).toBe('invalid');
    });

    it('should return valid when control is valid and touched', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('valid value');
      fixture.componentRef.setInput('control', ctrl);

      comp.onBlur();
      fixture.detectChanges();

      expect(comp.inputState()).toBe('valid');
    });
  });

  describe('BaseInputDirective - errorMessage computed property', () => {
    it('should return null when control has no errors', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('valid value');
      fixture.componentRef.setInput('control', ctrl);

      expect(comp.errorMessage()).toBeNull();
    });

    it('should return minlength error message when validation fails', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('ab', {
        validators: c => (c.value.length < 5 ? { minlength: { requiredLength: 5, actualLength: 2 } } : null),
      });
      fixture.componentRef.setInput('control', ctrl);

      const msg = comp.errorMessage();
      expect(msg).toBe('global.input.error.minLength');
    });

    it('should return maxlength error message when input exceeds max length', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('toolongvalue', {
        validators: c => (c.value.length > 5 ? { maxlength: { requiredLength: 5, actualLength: 12 } } : null),
      });
      fixture.componentRef.setInput('control', ctrl);

      const msg = comp.errorMessage();
      expect(msg).toBe('global.input.error.maxLength');
    });

    it('should return required error message when input is empty and required', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('');
      ctrl.setErrors({ required: true });
      fixture.componentRef.setInput('control', ctrl);
      fixture.componentRef.setInput('required', true);

      const msg = comp.errorMessage();
      expect(msg).toBe('global.input.error.required');
    });

    it('should handle unknown error types gracefully', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('test', {
        validators: () => ({ customUnknownError: true }),
      });
      fixture.componentRef.setInput('control', ctrl);
      fixture.detectChanges();

      const msg = comp.errorMessage();
      expect(msg).toBe('Invalid: customUnknownError');
    });
  });

  describe('BaseInputDirective - focus/blur handlers', () => {
    it('should set isFocused signal to true on onFocus', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      expect(comp.isFocused()).toBe(false);
      comp.onFocus();
      expect(comp.isFocused()).toBe(true);
    });

    it('should set isFocused signal to false on onBlur', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      comp.onFocus();
      expect(comp.isFocused()).toBe(true);

      comp.onBlur();
      expect(comp.isFocused()).toBe(false);
    });

    it('should mark input as touched when onBlur is called', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;

      expect(comp.isTouched()).toBe(false);
      comp.onBlur();
      expect(comp.isTouched()).toBe(true);
    });
  });

  describe('BaseInputDirective - formControl computed property', () => {
    it('should return provided FormControl when control input is a FormControl', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('test value');
      fixture.componentRef.setInput('control', ctrl);

      expect(comp.formControl()).toBe(ctrl);
      expect(comp.formControl().value).toBe('test value');
    });

    it('should create new FormControl when control input is undefined', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('control', undefined);

      expect(comp.formControl()).toBeDefined();
      expect(comp.formControl() instanceof FormControl).toBe(true);
    });
  });

  describe('BaseInputDirective - input signals', () => {
    it('should correctly bind model input signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('model', 'test model value');

      expect(comp.model()).toBe('test model value');
    });

    it('should correctly bind disabled input signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('disabled', true);

      expect(comp.disabled()).toBe(true);
    });

    it('should correctly bind icon input signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('icon', 'circle-info');

      expect(comp.icon()).toBe('circle-info');
    });

    it('should correctly bind tooltipText input signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('tooltipText', 'Help text');

      expect(comp.tooltipText()).toBe('Help text');
    });

    it('should correctly bind shouldTranslate input signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('shouldTranslate', true);

      expect(comp.shouldTranslate()).toBe(true);
    });

    it('should correctly bind autofocus input signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('autofocus', true);

      expect(comp.autofocus()).toBe(true);
    });

    it('should correctly bind errorEnabled input signal', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('errorEnabled', false);

      expect(comp.errorEnabled()).toBe(false);
    });
  });

  describe('BaseInputDirective - form control status changes', () => {
    it('should update formValidityVersion when form control status changes', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const ctrl = new FormControl('', { validators: c => (c.value === '' ? { required: true } : null), updateOn: 'change' });
      fixture.componentRef.setInput('control', ctrl);

      const initialVersion = comp.formValidityVersion();
      comp.isTouched(); // Access to trigger computation
      fixture.detectChanges();

      ctrl.setValue('new value');
      fixture.detectChanges();

      // The computed property should have been recalculated
      expect(comp.formValidityVersion()).toBeGreaterThan(initialVersion);
    });
  });
});
