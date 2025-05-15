import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';

import { ButtonColor, ButtonComponent, ButtonVariant } from '../../atoms/button/button.component';

import ButtonGroupComponent, { ButtonGroupData } from './button-group.component';

describe('ButtonGroupComponent', () => {
  let component: ButtonGroupComponent;
  let fixture: ComponentFixture<ButtonGroupComponent>;
  let componentRef: ComponentRef<ButtonGroupComponent>;

  const mockButtonGroupData: ButtonGroupData = {
    direction: 'horizontal',
    buttons: [
      {
        severity: 'primary' as ButtonColor,
        variant: 'filled' as ButtonVariant,
        label: 'Test Button',
        disabled: false,
        onClick() {},
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent, ButtonGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonGroupComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('data', mockButtonGroupData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct number of buttons', () => {
    const buttonElements = fixture.nativeElement.querySelectorAll('jhi-button');
    expect(buttonElements.length).toBe(mockButtonGroupData.buttons.length);
  });

  it('should call onClick when a button is clicked', () => {
    const spy = jest.spyOn(mockButtonGroupData.buttons[0], 'onClick');
    const buttonElement = fixture.nativeElement.querySelector('jhi-button');
    buttonElement.click();
    expect(spy).toHaveBeenCalled();
  });
});
