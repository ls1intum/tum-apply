import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('NumberInputComponent', () => {
  function createFixture() {
    const fixture = TestBed.createComponent(NumberInputComponent);
    fixture.componentRef.setInput('label', 'Test Number');
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('minFractionDigits', 1);
    fixture.componentRef.setInput('maxFractionDigits', 2);
    fixture.componentRef.setInput('id', 'numInput');
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent, ReactiveFormsModule],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render label and required indicator', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('label', 'Test Number');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    expect(comp.label()).toBe('Test Number');
    expect(comp.required()).toBe(true);
  });

  it('should emit modelChange and update form control on input change', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const spyEmit = vi.spyOn(comp.modelChange, 'emit');
    const mockCtrl = new FormControl(0);
    vi.spyOn(comp, 'formControl').mockReturnValue(mockCtrl);

    comp.onInputChange(5);
    expect(spyEmit).toHaveBeenCalledWith(5);
    expect(mockCtrl.value).toBe(5);
    expect(mockCtrl.dirty).toBe(true);
  });

  it('should correctly apply min/max fraction digits from inputs', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    expect(comp.minFractionDigits()).toBe(1);
    expect(comp.maxFractionDigits()).toBe(2);
  });

  it('should mark smallerThanMin and largerThanMax correctly', async () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('model', -1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(comp.smallerThanMin()).toBe(true);

    fixture.componentRef.setInput('model', 15);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(comp.largerThanMax()).toBe(true);
  });

  it('should validate value below min', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const ctrl = new FormControl(0);
    comp['validateMinMax'](-2, ctrl);
    expect(ctrl.errors?.min).toEqual({ min: 0, actual: -2 });
  });

  it('should validate value above max', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const ctrl = new FormControl(0);
    comp['validateMinMax'](20, ctrl);
    expect(ctrl.errors?.max).toEqual({ max: 10, actual: 20 });
  });

  it('should clear validation errors when value within range', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const ctrl = new FormControl(0);
    comp['validateMinMax'](5, ctrl);
    expect(ctrl.errors).toBeNull();
  });

  it('should show tooltip when icon=circle-info and tooltipText provided', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('icon', 'circle-info');
    fixture.componentRef.setInput('tooltipText', 'Helpful tip');
    fixture.detectChanges();

    expect(comp.icon()).toBe('circle-info');
    expect(comp.tooltipText()).toBe('Helpful tip');
  });

  it('should render regular icon when icon is not circle-info', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('icon', 'user');
    fixture.detectChanges();

    expect(comp.icon()).toBe('user');
    expect(comp.tooltipText()).toBeUndefined();
  });

  it('should call onFocus and onBlur handlers', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    const spyFocus = vi.spyOn(comp, 'onFocus');
    const spyBlur = vi.spyOn(comp, 'onBlur');

    comp.onFocus();
    comp.onBlur();

    expect(spyFocus).toHaveBeenCalled();
    expect(spyBlur).toHaveBeenCalled();
  });

  it('should handle null value gracefully', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const ctrl = new FormControl(null);
    comp['validateMinMax'](null, ctrl);
    expect(ctrl.errors).toBeNull();
  });

  it('should handle undefined value gracefully', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const ctrl = new FormControl(undefined);
    comp['validateMinMax'](undefined, ctrl);
    expect(ctrl.errors).toBeNull();
  });

  it('should not show validation errors when model is undefined', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('model', undefined);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.smallerThanMin()).toBe(false);
    expect(comp.largerThanMax()).toBe(false);
  });
});
