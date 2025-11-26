import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

import { PasswordInputComponent } from 'app/shared/components/atoms/password-input/password-input';

describe('PasswordInputComponent', () => {
  const getFormControl = (component: PasswordInputComponent) => (component as any).formControl();

  function createComponent(runInitialDetect = true) {
    const fixture = TestBed.createComponent(PasswordInputComponent);
    const component = fixture.componentInstance as any;

    if (!component.formControl || component.formControl() == null) {
      const ctrl = new FormControl('');
      component.formControl = () => ctrl;
    }

    if (runInitialDetect) {
      fixture.detectChanges();
    }

    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordInputComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  it('should create and render the password input', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();

    const passwordDebug = fixture.debugElement.query(By.css('p-password'));
    expect(passwordDebug).toBeTruthy();
  });

  it('should emit modelChange and update form control on input change', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const emitSpy = vi.spyOn(component.modelChange, 'emit');
    const value = 'MySecurePassword123!';

    component.onInputChange(value);

    const ctrl = getFormControl(component);
    expect(ctrl.value).toBe(value);
    expect(ctrl.dirty).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(value);
  });

  it('should wire template events to component methods', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const changeSpy = vi.spyOn(component, 'onInputChange');
    const blurSpy = vi.spyOn(component, 'onBlur');
    const focusSpy = vi.spyOn(component, 'onFocus');

    const passwordDebug = fixture.debugElement.query(By.css('p-password'));
    expect(passwordDebug).toBeTruthy();

    passwordDebug.triggerEventHandler('ngModelChange', 'test123');
    expect(changeSpy).toHaveBeenCalledWith('test123');

    passwordDebug.triggerEventHandler('onBlur', {});
    expect(blurSpy).toHaveBeenCalled();

    passwordDebug.triggerEventHandler('onFocus', {});
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should not render a label when no label is provided', () => {
    const fixture = createComponent();

    const labelDebug = fixture.debugElement.query(By.css('label.custom-label'));
    expect(labelDebug).toBeNull();
  });

  it('should render label, required indicator and icon without tooltip', () => {
    const fixture = createComponent();
    fixture.componentRef.setInput('label', 'auth.common.password.label');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('icon', 'user');
    fixture.detectChanges();

    const labelDebug = fixture.debugElement.query(By.css('label.custom-label'));
    expect(labelDebug).toBeTruthy();
    expect(labelDebug.nativeElement.textContent).toContain('auth.common.password.label');

    const requiredSpan = fixture.debugElement.query(By.css('label.custom-label .required'));
    expect(requiredSpan).toBeTruthy();

    const iconDebug = fixture.debugElement.query(By.css('label.custom-label fa-icon'));
    expect(iconDebug).toBeTruthy();
    expect(iconDebug.attributes['ng-reflect-p-tooltip']).toBeUndefined();
  });

  it('should render info icon with tooltip when tooltipText is provided', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('label', 'auth.common.password.label');
    fixture.componentRef.setInput('icon', 'circle-info');
    fixture.componentRef.setInput('tooltipText', 'Tooltip text');
    fixture.detectChanges();

    const iconDebug = fixture.debugElement.query(By.css('label.custom-label fa-icon'));
    expect(iconDebug).toBeTruthy();

    const tooltipTextFn = (fixture.componentInstance as any).tooltipText as () => string;
    expect(tooltipTextFn()).toBe('Tooltip text');
  });

  it('should apply error class when input state is invalid', () => {
    const fixture = createComponent(false);
    const component = fixture.componentInstance;

    (component as any).inputState = () => 'invalid';
    (component as any).isFocused = () => false;
    (component as any).errorMessage = () => 'Invalid password';

    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.input-wrapper'));
    expect(wrapper.classes['error']).toBe(true);

    const errorTextDebug = fixture.debugElement.query(By.css('.error-text'));
    expect(errorTextDebug.nativeElement.textContent.trim()).toBe('Invalid password');
  });

  it('should not apply error class when input state is valid', () => {
    const fixture = createComponent(false);
    const component = fixture.componentInstance;

    (component as any).inputState = () => 'valid';
    (component as any).isFocused = () => false;

    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.input-wrapper'));
    expect(wrapper.classes['error']).toBeFalsy();

    const errorTextDebug = fixture.debugElement.query(By.css('.error-text'));
    expect(errorTextDebug.nativeElement.textContent.trim()).toBe('');
  });

  it('should render hidden form control input when formControl exists', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const ctrl = getFormControl(component);
    expect(ctrl).toBeTruthy();

    const hiddenInput = fixture.debugElement.query(By.css('input[type="hidden"]'));
    expect(hiddenInput).toBeTruthy();
  });
});
