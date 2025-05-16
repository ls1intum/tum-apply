import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringInputComponent } from './string-input.component';
import { ComponentRef } from '@angular/core';
import ButtonGroupComponent from '../../molecules/button-group/button-group.component';

describe('StringInputComponent', () => {
  let component: StringInputComponent;
  let fixture: ComponentFixture<StringInputComponent>;
  let componentRef: ComponentRef<StringInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StringInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StringInputComponent);
    component = fixture.componentInstance;

    componentRef = fixture.componentRef;
    componentRef.setInput('value', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should update model value when input changes', () => {
  //   component.value.set('');
  //   fixture.detectChanges();

  //   const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');

  //   inputEl.value = 'New Value';
  //   inputEl.dispatchEvent(new Event('input'));

  //   expect(component.value()).toBe('New Value');
  // });
  // it('should render label and icon when provided', () => {
  //   componentRef.setInput('label', 'Test Label');
  //   componentRef.setInput('icon', 'fa-user'); // Assume this is a valid icon class
  //   componentRef.setInput('value', ''); // Assume this is a valid icon class

  //   fixture.detectChanges();

  //   const labelEl = fixture.nativeElement.querySelector('label');
  //   const iconEl = fixture.nativeElement.querySelector('fa-icon');

  //   expect(labelEl?.textContent).toContain('Test Label');
  //   expect(iconEl).toBeTruthy();
  // });
});
