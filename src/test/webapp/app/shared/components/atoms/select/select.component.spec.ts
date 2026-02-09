import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

describe('SelectComponent', () => {
  const mockItems: SelectOption[] = [
    { name: 'Option 1', value: 'opt1', icon: 'circle' },
    { name: 'Option 2', value: 'opt2' },
  ];

  function createFixture() {
    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('items', mockItems);
    fixture.componentRef.setInput('selected', mockItems[0]);
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('placeholder', 'Choose...');
    fixture.componentRef.setInput('width', '200px');
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
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

  it('should render label, asterisk, and placeholder', () => {
    const fixture = createFixture();
    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).toContain('Test Label');
    expect(label.textContent).toContain('*');

    expect(fixture.componentInstance.placeholder()).toBe('Choose...');
  });

  it('should not show asterisk when required=false', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('required', false);
    fixture.detectChanges();

    const label = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.textContent).not.toContain('*');
  });

  it('should emit selectedChange when onSelectionChange called', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const emitSpy = vi.spyOn(comp.selectedChange, 'emit');

    const next = mockItems[1];
    comp.onSelectionChange(next);

    expect(emitSpy).toHaveBeenCalledWith(next);
  });

  it('should resolve primitive values to matching options before emitting', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const emitSpy = vi.spyOn(comp.selectedChange, 'emit');

    comp.onSelectionChange('opt2');

    expect(emitSpy).toHaveBeenCalledWith(mockItems[1]);
  });

  it('should emit fallback option when primitive does not match any item', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const emitSpy = vi.spyOn(comp.selectedChange, 'emit');

    comp.onSelectionChange('missing');

    expect(emitSpy).toHaveBeenCalledWith({ name: 'missing', value: 'missing' });
  });

  it('should apply disabled styles when disabled', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.select-wrapper')).nativeElement;
    expect(wrapper.classList).toContain('disabled');
    expect(fixture.componentInstance.disabled()).toBe(true);
  });

  it('should toggle isOpen state when dropdown opens/closes', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const selectEl = fixture.debugElement.query(By.css('p-select'));

    selectEl.triggerEventHandler('onShow', {});
    expect(comp.isOpen).toBe(true);

    selectEl.triggerEventHandler('onHide', {});
    expect(comp.isOpen).toBe(false);
  });

  it('should support tooltipText input when icon=circle-info', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', 'circle-info');
    fixture.componentRef.setInput('tooltipText', 'Helpful text');
    fixture.detectChanges();

    expect(fixture.componentInstance.icon()).toBe('circle-info');
    expect(fixture.componentInstance.tooltipText()).toBe('Helpful text');
  });

  it('should render regular icon when icon is not circle-info', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', 'user');
    fixture.detectChanges();

    const icons = fixture.debugElement.queryAll(By.css('fa-icon'));
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should accept translateItems=true without error', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('translateItems', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.translateItems()).toBe(true);
  });

  it('should update selected and placeholder dynamically', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('selected', mockItems[1]);
    fixture.componentRef.setInput('placeholder', 'Pick one');
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toEqual(mockItems[1]);
    expect(fixture.componentInstance.placeholder()).toBe('Pick one');
  });

  it('should enable filtering when filter=true', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('filter', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.filter()).toBe(true);
    const selectEl = fixture.debugElement.query(By.css('p-select'));
    expect(selectEl.componentInstance.filter).toBe(true);
  });

  it('should handle empty items array gracefully', () => {
    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.componentInstance.items()).toEqual([]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should handle null/undefined selected value', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('selected', undefined);
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBeUndefined();
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should show clear button when showClear=true', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('showClear', true);
    fixture.detectChanges();

    const selectEl = fixture.debugElement.query(By.css('p-select'));
    expect(selectEl.componentInstance.showClear).toBe(true);
  });

  it('should not show clear button by default', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance.showClear()).toBe(false);
  });
});
