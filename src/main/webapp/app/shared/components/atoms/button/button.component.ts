import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
// import '@fortawesome/fontawesome-svg-core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import SharedModule from 'app/shared/shared.module';
import { ButtonModule } from 'primeng/button';

export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'white';
export type ButtonVariant = 'filled' | 'outlined' | 'text';

@Component({
  selector: 'jhi-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  standalone: true,
  imports: [CommonModule, SharedModule, ButtonModule, FontAwesomeModule],
})
export class ButtonComponent {
  @Input() color: ButtonColor = 'primary';
  @Input() variant: ButtonVariant = 'filled';
  @Input() icon?: string = undefined;
  @Input() label?: string = undefined;
  @Input() numberOfFavorites?: number = undefined;
  @Input() disabled: boolean = false;
}
