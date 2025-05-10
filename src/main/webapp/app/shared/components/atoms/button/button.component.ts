import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import SharedModule from 'app/shared/shared.module';
import { ButtonModule } from 'primeng/button';

/**
 * Defines the available button color options.
 * - `primary`: Default primary color.
 * - `secondary`: Secondary styling.
 * - `success`: Indicates successful action.
 * - `warning`: Indicates caution.
 * - `error`: Indicates an error or destructive action.
 * - `neutral`: Neutral tone, less emphasis.
 * - `white`: Minimal styling, often used on colored backgrounds.
 */
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'white';

/**
 * Defines the visual style of the button.
 * - `filled`: Solid background.
 * - `outlined`: Transparent background with a border.
 * - `text`: Minimal styling with just text.
 */
export type ButtonVariant = 'filled' | 'outlined' | 'text';

/**
 * Represents the structure of a button object.
 */
export type Button = {
  color: ButtonColor;
  variant: ButtonVariant;
  icon?: string;
  label?: string;
  numberOfFavorites?: number;
  disabled: boolean;
  onClick: VoidFunction;
};

/**
 * A customizable UI button component supporting icon, label, variant, and color options.
 * Designed to be used as a standalone Angular component.
 */
@Component({
  selector: 'jhi-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  standalone: true,
  imports: [CommonModule, SharedModule, ButtonModule, FontAwesomeModule],
})
export class ButtonComponent {
  /**
   * Defines the color theme of the button.
   * @default 'primary'
   */
  @Input() color: ButtonColor = 'primary';

  /**
   * Defines the visual variant of the button.
   * @default 'filled'
   */
  @Input() variant: ButtonVariant = 'filled';

  /**
   * Optional icon name to display within the button (using a FontAwesome icon).
   */
  @Input() icon?: string = undefined;

  /**
   * Optional label text displayed on the button.
   */
  @Input() label?: string = undefined;

  /**
   * Optional number of favorites or similar numeric display.
   */
  @Input() numberOfFavorites?: number = undefined;

  /**
   * Whether the button is disabled and non-interactive.
   * @default false
   */
  @Input() disabled = false;

  /**
   * Additional CSS classes to apply to the button element.
   * @default ''
   */
  @Input() buttonClass = '';
}
