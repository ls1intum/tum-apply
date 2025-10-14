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

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render label and required indicator', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).toContain('Test Number');
    expect(label.textContent).toContain('*');
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

  it('should show tooltip when icon=circle-info and tooltipText provided', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', 'circle-info');
    fixture.componentRef.setInput('tooltipText', 'Helpful tip');
    fixture.detectChanges();
    await fixture.whenStable();

    const icons = fixture.debugElement.queryAll(By.css('fa-icon'));
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render regular icon when icon is not circle-info', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', 'user');
    fixture.detectChanges();
    await fixture.whenStable();

    const icons = fixture.debugElement.queryAll(By.css('fa-icon'));
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should call onFocus and onBlur handlers', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const spyFocus = vi.spyOn(comp, 'onFocus');
    const spyBlur = vi.spyOn(comp, 'onBlur');

    const input = fixture.debugElement.query(By.css('p-inputnumber'));
    input.triggerEventHandler('onFocus', {});
    input.triggerEventHandler('onBlur', {});

    expect(spyFocus).toHaveBeenCalled();
    expect(spyBlur).toHaveBeenCalled();
  });
});
