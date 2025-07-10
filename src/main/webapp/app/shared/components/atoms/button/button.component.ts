import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, ViewEncapsulation, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import SharedModule from 'app/shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

export type ButtonColor = 'primary' | 'secondary' | 'contrast' | 'success' | 'warn' | 'danger' | 'info';

export type ButtonVariant = 'outlined' | 'text';

export type Button = {
  severity: ButtonColor;
  variant?: ButtonVariant;
  icon?: string;
  isExternalLink?: boolean;
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
  imports: [CommonModule, SharedModule, ButtonModule, FontAwesomeModule, OverlayBadgeModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
})
export class ButtonComponent {
  severity = input<ButtonColor>('primary');
  variant = input<ButtonVariant>();
  icon = input<string | undefined>(undefined);
  isExternalLink = input<boolean | undefined>(false);
  label = input<string | undefined>(undefined);
  numberOfFavorites = input<number | undefined>(undefined);
  disabled = input<boolean>(false);

  readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  iconPrefix(): 'fas' | 'fab' {
    if (this.icon() === 'microsoft' || this.icon() === 'google' || this.icon() === 'apple') {
      return 'fab';
    }
    return 'fas';
  }
}
