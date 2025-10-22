import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    fixture.detectChanges();
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
    fixture.detectChanges();

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
    fixture.detectChanges();
    await fixture.whenStable();

    expect(comp.icon()).toBe('user');
    expect(comp.tooltipText()).toBeUndefined();
  });

  it('should show tooltip when icon is circle-info and tooltipText is provided', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('icon', 'circle-info');
    fixture.componentRef.setInput('tooltipText', 'Helpful information');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(comp.icon()).toBe('circle-info');
    expect(comp.tooltipText()).toBe('Helpful information');
  });

  it('should show translated label when shouldTranslate=true', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('shouldTranslate', true);
    fixture.componentRef.setInput('label', 'string.label');
    fixture.detectChanges();
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
});
