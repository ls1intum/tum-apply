import { Component, Input } from '@angular/core';
import { ButtonColor, ButtonComponent, ButtonVariant } from '../../atoms/button/button.component';
import { CommonModule } from '@angular/common';

export type Button = {
  color: ButtonColor;
  variant: ButtonVariant;
  icon?: string;
  label?: string;
  numberOfFavorites?: number;
  disabled: boolean;
  onClick: VoidFunction;
};

export type ButtonGroupData = {
  direction: 'vertical' | 'horizontal';
  buttons: Button[];
};

@Component({
  selector: 'jhi-button-group',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './button-group.component.html',
  styleUrl: './button-group.component.scss',
})
export default class ButtonGroupComponent {
  @Input({ required: true, alias: 'data' }) buttonGroupData!: ButtonGroupData;
}
