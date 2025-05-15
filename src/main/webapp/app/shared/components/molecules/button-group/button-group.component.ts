import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Button, ButtonComponent } from '../../atoms/button/button.component';

export type ButtonGroupDirection = 'vertical' | 'horizontal';

/**
 * Defines the data structure for a group of buttons.
 *
 * @property direction - Layout direction of the button group:
 * - `'vertical'`: Buttons are stacked vertically.
 * - `'horizontal'`: Buttons are aligned side by side.
 *
 * @property buttons - Array of `Button` objects to render.
 */
export type ButtonGroupData = {
  direction: ButtonGroupDirection;
  buttons: Button[];
};

/**
 * A UI component that displays a group of buttons arranged
 * vertically or horizontally based on the provided input data.
 */
@Component({
  selector: 'jhi-button-group',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './button-group.component.html',
  styleUrl: './button-group.component.scss',
})
export default class ButtonGroupComponent {
  data = input.required<ButtonGroupData>();
}
