import { ComponentFixture, TestBed } from '@angular/core/testing';

import ButtonGroupComponent, { ButtonGroupData } from './button-group.component';
import { ButtonColor, ButtonVariant } from '../../atoms/button/button.component';

describe('ButtonGroupComponent', () => {
  let component: ButtonGroupComponent;
  let fixture: ComponentFixture<ButtonGroupComponent>;

  const mockButtonGroupData: ButtonGroupData = {
    direction: 'horizontal',
    buttons: [
      {
        color: 'primary' as ButtonColor,
        variant: 'filled' as ButtonVariant,
        label: 'Test Button',
        disabled: false,
        onClick: () => {},
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonGroupComponent);
    component = fixture.componentInstance;
    component.buttonGroupData = mockButtonGroupData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
