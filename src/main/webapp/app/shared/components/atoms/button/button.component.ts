import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import SharedModule from 'app/shared/shared.module';
import { ButtonModule } from 'primeng/button';

export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warn' | 'danger' | 'info';

export type ButtonVariant = 'outlined' | 'text';

export type Button = {
  color: ButtonColor;
  variant?: ButtonVariant;
  icon?: string;
  label?: string;
  numberOfFavorites?: number;
  disabled: boolean;
  onClick: VoidFunction;
};

@Component({
  selector: 'jhi-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  standalone: true,
  imports: [CommonModule, SharedModule, ButtonModule, FontAwesomeModule],
  encapsulation: ViewEncapsulation.None,
})
export class ButtonComponent {
  color = input<ButtonColor>('primary');
  variant = input<ButtonVariant>();
  icon = input<string | undefined>(undefined);
  label = input<string | undefined>(undefined);
  numberOfFavorites = input<number | undefined>(undefined);
  disabled = input<boolean>(false);
  buttonClass = input<string>('');
}
