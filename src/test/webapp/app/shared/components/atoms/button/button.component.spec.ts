import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { By } from '@angular/platform-browser';

type ButtonForTest = {
  label: string;
  icon: string;
  disabled: boolean;
  isExternalLink: boolean;
  numberOfFavorites: number;
  severity: 'primary' | 'secondary' | 'contrast' | 'success' | 'warn' | 'danger' | 'info';
  variant: 'outlined' | 'text';
  fullWidth: boolean;
  shouldTranslate: boolean;
  size: 'sm' | 'md' | 'lg';
  loading: boolean;
  type: 'button' | 'submit' | 'reset';
};

describe('ButtonComponent', () => {
  function createButtonFixture(overrideInputs: Partial<ButtonForTest>) {
    const fixture = TestBed.createComponent(ButtonComponent);

    const defaults: Partial<ButtonForTest> = {
      disabled: false,
      isExternalLink: false,
      severity: 'primary',
      variant: 'text',
      shouldTranslate: false,
      size: 'lg',
      loading: false,
      type: 'button',
    };

    const inputs = Object.assign({}, defaults, overrideInputs);

    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key as keyof ButtonForTest, value);
    });

    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  it('should render label and default to type=button when no overrides are provided', () => {
    const fixture = createButtonFixture({ label: 'Click Me' });

    const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.disabled).toBe(false);
    expect(buttonElement.type).toBe('button');
    expect(buttonElement.textContent).toContain('Click Me');
  });

  it('should show icon when icon input is set', () => {
    const fixture = createButtonFixture({ icon: 'google' });

    expect(fixture.nativeElement.querySelector('fa-icon')).toBeTruthy();
  });

  it('should show external link icon if isExternalLink is true', () => {
    const fixture = createButtonFixture({ isExternalLink: true });

    expect(fixture.nativeElement.querySelector('.external-icon')).toBeTruthy();
  });

  it('should show favorites badge if numberOfFavorites is set', () => {
    const fixture = createButtonFixture({ numberOfFavorites: 5 });

    expect(fixture.nativeElement.querySelector('p-overlaybadge')).toBeTruthy();
  });

  it('should apply size-specific class when size is sm', () => {
    const fixture = createButtonFixture({ size: 'sm' });
    expect(fixture.componentInstance.buttonClass()).contain('w-10 h-10');
  });
});
