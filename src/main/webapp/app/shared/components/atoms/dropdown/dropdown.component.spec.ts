import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

import { DropdownComponent, DropdownOption } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent;
  let fixture: ComponentFixture<DropdownComponent>;
  let library: FaIconLibrary;

  const optionsMock: DropdownOption[] = [
    { name: 'Option A', value: 'a' },
    { name: 'Option B', value: 'b' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
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

  it('should disable dropdown when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.css('p-dropdown'));
    expect(dropdown.componentInstance.disabled);
  });

  it('should emit selectedChange when an option is selected', () => {
    const spy = jest.spyOn(component.selectedChange, 'emit');
    component.onSelectionChange(optionsMock[0]);
    expect(spy).toHaveBeenCalledWith(optionsMock[0]);
  });

  it('should toggle chevron icon based on isOpen state', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('fa-icon');
    expect(icon.getAttribute('ng-reflect-icon')).toContain('chevron-up');
  });
});
