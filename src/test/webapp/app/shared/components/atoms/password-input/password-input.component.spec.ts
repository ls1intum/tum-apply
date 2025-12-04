import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Password } from 'primeng/password';

import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

import { PasswordInputComponent } from 'app/shared/components/atoms/password-input/password-input';

type PasswordInputComponentTestInstance = Omit<
  PasswordInputComponent,
  'formControl' | 'inputState' | 'isFocused' | 'errorMessage' | 'tooltipText'
> & {
  formControl?: () => FormControl<string | null>;
  inputState?: () => 'untouched' | 'valid' | 'invalid' | string;
  isFocused?: () => boolean;
  errorMessage?: () => string | null;
  tooltipText?: () => string | undefined;
};

describe('PasswordInputComponent', () => {
  const getFormControl = (component: PasswordInputComponentTestInstance) => {
    if (!component.formControl) {
      throw new Error('formControl is not defined on PasswordInputComponent');
    }

    return component.formControl();
  };

  function createComponent(runInitialDetect = true) {
    const fixture = TestBed.createComponent(PasswordInputComponent);
    const component = fixture.componentInstance as PasswordInputComponentTestInstance;

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

  it('should create the password input component', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as PasswordInputComponentTestInstance;

    expect(component).toBeTruthy();
  });

  it('should emit modelChange and update form control on input change', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as PasswordInputComponentTestInstance;

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
    const component = fixture.componentInstance as PasswordInputComponentTestInstance;

    const changeSpy = vi.spyOn(component, 'onInputChange');
    const blurSpy = vi.spyOn(component, 'onBlur');
    const focusSpy = vi.spyOn(component, 'onFocus');

    const passwordDebug = fixture.debugElement.query(By.directive(Password));
    expect(passwordDebug).toBeTruthy();

    passwordDebug.triggerEventHandler('ngModelChange', 'test123');
    expect(changeSpy).toHaveBeenCalledWith('test123');

    passwordDebug.triggerEventHandler('onBlur', {});
    expect(blurSpy).toHaveBeenCalled();

    passwordDebug.triggerEventHandler('onFocus', {});
    expect(focusSpy).toHaveBeenCalled();
  });
});
