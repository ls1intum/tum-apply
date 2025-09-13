import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

import { SelectComponent, SelectOption } from './select.component';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;
  let library: FaIconLibrary;

  const optionsMock: SelectOption[] = [
    { name: 'Option A', value: 'a' },
    { name: 'Option B', value: 'b' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;

    library = TestBed.inject(FaIconLibrary);
    library.addIcons(faChevronDown, faChevronUp);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the label', () => {
    fixture.componentRef.setInput('label', 'Choose Option');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Choose Option');
  });

  it('should disable select when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('p-select'));
    expect(select.componentInstance.disabled);
  });

  it('should emit selectedChange when an option is selected', () => {
    const spy = jest.spyOn(component.selectedChange, 'emit');
    component.onSelectionChange(optionsMock[0]);
    expect(spy).toHaveBeenCalledWith(optionsMock[0]);
  });

  it('should toggle chevron icon based on isOpen state', () => {
    expect(component.isOpen).toBeFalsy();
    let icon = fixture.debugElement.query(By.css('fa-icon')).componentInstance;
    expect(icon.icon()).toEqual(['fas', 'chevron-down']);

    component.isOpen = true;
    fixture.detectChanges();

    icon = fixture.debugElement.query(By.css('fa-icon')).componentInstance;
    expect(icon.icon()).toEqual(['fas', 'chevron-up']);
  });
});
