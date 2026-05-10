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

  it('should toggle isOpen state when dropdown opens/closes', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const selectEl = fixture.debugElement.query(By.css('p-select'));

    selectEl.triggerEventHandler('onShow', {});
    expect(comp.isOpen).toBe(true);

    selectEl.triggerEventHandler('onHide', {});
    expect(comp.isOpen).toBe(false);
  });

});
