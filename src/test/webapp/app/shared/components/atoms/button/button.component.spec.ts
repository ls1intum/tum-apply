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

    const inputs = { ...defaults, ...overrideInputs };

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

  it('should render with default inputs', () => {
    const fixture = createButtonFixture({ label: 'Click Me' });

    const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement).toBeTruthy();
    expect(buttonElement.disabled).toBe(false);
    expect(buttonElement.type).toBe('button');
    expect(buttonElement.textContent).toContain('Click Me');
  });

  it('should show icon when icon input is set', () => {
    const fixture = createButtonFixture({ icon: 'google' });

    const iconEl = fixture.nativeElement.querySelector('fa-icon');
    expect(iconEl).toBeTruthy();
  });

  it('should show external link icon if isExternalLink is true', () => {
    const fixture = createButtonFixture({ isExternalLink: true });

    const externalIcon = fixture.nativeElement.querySelector('.external-icon');
    expect(externalIcon).toBeTruthy();
  });

  it('should apply full width class when fullWidth is true', () => {
    const fixture = createButtonFixture({ fullWidth: true });

    const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.className).toContain('w-full');
  });

  it('should apply rounded icon button class when label is not set', () => {
    const fixture = createButtonFixture({ size: 'sm' });

    const buttonEl: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(Array.from(buttonEl.classList)).toContain('rounded-md');
  });

  it('should show badge if numberOfFavorites is set', () => {
    const fixture = createButtonFixture({ numberOfFavorites: 5 });

    const badgeEl = fixture.nativeElement.querySelector('p-overlaybadge');
    expect(badgeEl).toBeTruthy();
  });

  it('should show badge if size is set', () => {
    const fixture = createButtonFixture({ size: 'sm' });
    expect(fixture.componentInstance.buttonClass()).contain('w-10 h-10');
  });
});
