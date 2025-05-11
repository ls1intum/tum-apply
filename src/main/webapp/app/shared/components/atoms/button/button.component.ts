import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import SharedModule from 'app/shared/shared.module';
import { ButtonModule } from 'primeng/button';

/**
 * Defines the available button color options.
 * - `primary`: Default primary color.
 * - `secondary`: Secondary styling.
 * - `success`: Indicates successful action.
 * - `warn`: Indicates caution.
 * - `danger`: Indicates an error or destructive action.
 * - `info`: Neutral tone, less emphasis.
 */
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warn' | 'danger' | 'info';

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
  color = input<ButtonColor>('primary');

  /**
   * Defines the visual variant of the button.
   * @default 'filled'
   */
  variant = input<ButtonVariant>('filled');

  /**
   * Optional icon name to display within the button (using a FontAwesome icon).
   */
  icon = input<string | undefined>(undefined);

  /**
   * Optional label text displayed on the button.
   */
  label = input<string | undefined>(undefined);

  /**
   * Optional number of favorites or similar numeric display.
   */
  numberOfFavorites = input<number | undefined>(undefined);

  /**
   * Whether the button is disabled and non-interactive.
   * @default false
   */
  disabled = input<boolean>(false);

  /**
   * Additional CSS classes to apply to the button element.
   * @default ''
   */
  buttonClass = input<string>('');
}
