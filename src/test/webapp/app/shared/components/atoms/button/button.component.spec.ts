import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

describe('ButtonComponent', () => {
  function createButtonFixture(
    overrideInputs?: Partial<{
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
    }>,
  ) {
    const fixture = TestBed.createComponent(ButtonComponent);

    fixture.componentRef.setInput('label', overrideInputs?.label ?? 'Click Me');
    fixture.componentRef.setInput('icon', overrideInputs?.icon);
    fixture.componentRef.setInput('disabled', overrideInputs?.disabled ?? false);
    fixture.componentRef.setInput('isExternalLink', overrideInputs?.isExternalLink ?? false);
    fixture.componentRef.setInput('numberOfFavorites', overrideInputs?.numberOfFavorites);
    fixture.componentRef.setInput('severity', overrideInputs?.severity ?? 'primary');
    fixture.componentRef.setInput('variant', overrideInputs?.variant);
    fixture.componentRef.setInput('fullWidth', overrideInputs?.fullWidth ?? false);
    fixture.componentRef.setInput('shouldTranslate', overrideInputs?.shouldTranslate ?? false);
    fixture.componentRef.setInput('size', overrideInputs?.size ?? 'lg');
    fixture.componentRef.setInput('loading', overrideInputs?.loading ?? false);
    fixture.componentRef.setInput('type', overrideInputs?.type ?? 'button');

    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock(), provideFontAwesomeTesting()],
    }).compileComponents();
  });

  it('should render with default inputs', () => {
    const fixture = createButtonFixture();

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

  it('should use "fab" prefix for brand icons', () => {
    const fixture = createButtonFixture({ icon: 'google' });

    expect(fixture.componentInstance.iconPrefix()).toBe('fab');
  });

  it('should use "fas" prefix for solid icons', () => {
    const fixture = createButtonFixture({ icon: 'download' });

    expect(fixture.componentInstance.iconPrefix()).toBe('fas');
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
    const fixture = createButtonFixture({ label: undefined, size: 'sm' });

    const buttonEl: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(buttonEl.className).toContain('p-ripple p-button p-button-primary p-component');
  });

  it('should show badge if numberOfFavorites is set', () => {
    const fixture = createButtonFixture({ numberOfFavorites: 5 });

    const badgeEl = fixture.nativeElement.querySelector('p-overlaybadge');
    expect(badgeEl).toBeTruthy();
  });

  it('should show badge if size is set', () => {
    const fixture = createButtonFixture({ size: 'sm' });
    fixture.componentRef.setInput('label', undefined);
    expect(fixture.componentInstance.buttonClass()).contain('w-8 h-8');
  });
});
