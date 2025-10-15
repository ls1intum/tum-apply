import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
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

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render label and required asterisk', () => {
    const fixture = createFixture();
    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).toContain('Test Label');
    expect(label.textContent).toContain('*');
  });

  it('should not show asterisk when required=false', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('required', false);
    fixture.detectChanges();

    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).not.toContain('*');
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
    const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(inputEl.placeholder).toBe('Enter value');
  });

  it('should render regular icon when icon is not circle-info', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', 'user');
    fixture.detectChanges();
    await fixture.whenStable();

    const icons = fixture.debugElement.queryAll(By.css('fa-icon'));
    expect(icons.length).toBeGreaterThan(0);

    const hasTooltip = icons.some(el => el.attributes['ng-reflect-p-tooltip'] || el.componentInstance?.pTooltip);
    expect(hasTooltip).toBe(false);
  });

  it('should show tooltip when icon is circle-info and tooltipText is provided', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', 'circle-info');
    fixture.componentRef.setInput('tooltipText', 'Helpful information');
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      const iconWithTooltip = fixture.debugElement.query(By.css('fa-icon[pTooltip]'));
      expect(iconWithTooltip).toBeTruthy();
      expect(fixture.componentInstance.tooltipText()).toBe('Helpful information');
    });
  });

  it('should show translated label when shouldTranslate=true', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('shouldTranslate', true);
    fixture.componentRef.setInput('label', 'string.label');
    fixture.detectChanges();
    await fixture.whenStable();

    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).toContain('string.label');
  });

  it('should call onFocus and onBlur handlers when input is focused and blurred', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const spyFocus = vi.spyOn(comp, 'onFocus');
    const spyBlur = vi.spyOn(comp, 'onBlur');

    const inputEl = fixture.debugElement.query(By.css('input'));
    inputEl.triggerEventHandler('focus', {});
    inputEl.triggerEventHandler('blur', {});

    expect(spyFocus).toHaveBeenCalled();
    expect(spyBlur).toHaveBeenCalled();
  });
});
